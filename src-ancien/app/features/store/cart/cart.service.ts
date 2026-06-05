import { Injectable, signal, computed, inject, effect } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { PsProduct } from '@app/core/models/ps/product.model';
import { CartWritable } from '@app/core/models/ps/cart.model';
import { CartService as PsCartService } from '@app/core/services/cart.service';
import { ProductService } from '@app/core/services/product.service';
import { CombinationService } from '@app/core/services/combination.service';
import { TaxResolverService } from '@app/core/services/tax-resolver.service';
import { psLang } from '@app/core/utils';
import {
  DEFAULT_LANG,
  DEFAULT_CURRENCY,
  DEFAULT_SHOP,
  DEFAULT_SHOP_GROUP,
} from '@app/core/constants';
import { UserSessionService } from '../services/user-session.service';

export interface CartItem {
  product:           PsProduct;
  combinationId:     number;   // 0 = simple product
  variantName:       string;   // '' = simple product
  quantity:          number;
  idTaxRulesGroup?:  number;
  /** Cached tax rate in % at the moment the item was added. */
  taxRate:           number;
}

const STORAGE_KEY = 'cart';
/** Maps a PrestaShop customer id → the id of their persistent storefront cart. */
const PS_MAP_KEY = 'store_cart_ps_ids';
const SYNC_DEBOUNCE_MS = 600;

@Injectable({ providedIn: 'root' })
export class CartService {
  private readonly session    = inject(UserSessionService);
  private readonly psCart     = inject(PsCartService);
  private readonly products   = inject(ProductService);
  private readonly combos     = inject(CombinationService);
  private readonly taxes      = inject(TaxResolverService);

  private items = signal<CartItem[]>([]);

  readonly cart  = this.items.asReadonly();
  readonly count = computed(() => this.items().reduce((s, i) => s + i.quantity, 0));
  /** Total HT (excluding VAT). */
  readonly totalHt = computed(() =>
    this.items().reduce((s, i) => s + parseFloat(i.product.price) * i.quantity, 0),
  );
  /** Total TTC (including VAT, per-item tax rate). */
  readonly totalTtc = computed(() =>
    this.items().reduce(
      (s, i) => s + parseFloat(i.product.price) * (1 + (i.taxRate || 0) / 100) * i.quantity,
      0,
    ),
  );
  /** @deprecated use totalHt. Kept for backwards compatibility. */
  readonly total = this.totalHt;

  /** PS customer id currently driving persistence; 0 = anonymous (localStorage). */
  private currentCustomerId = -1;
  /** PS cart id backing the logged-in customer's persistent cart. */
  private psCartId: number | null = null;
  /** True while rebuilding the cart from PS — suppresses write-back. */
  private restoring = false;
  private syncTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    // Load tax tables once so future cart mutations resolve correctly.
    this.taxes.ensureLoaded().subscribe({
      next: () => this.refreshTaxRates(),
      error: () => {},
    });

    // React to user selection / switch: load the right backing store.
    effect(() => {
      const user = this.session.currentUser();
      const customerId = user && user.id !== 0 ? user.id : 0;
      if (customerId === this.currentCustomerId) return;
      this.currentCustomerId = customerId;
      if (customerId === 0) {
        this.psCartId = null;
        this.items.set(this.loadLocal());
      } else {
        void this.restoreFromPs(customerId);
      }
    });
  }

  // ── Mutations ──────────────────────────────────────────────────────────────

  add(
    product: PsProduct,
    combinationId = 0,
    variantName = '',
    idTaxRulesGroup?: number,
  ): void {
    const taxRate = this.taxes.getRate(idTaxRulesGroup);
    this.items.update(cart => {
      const k  = this.key(product.id, combinationId);
      const hit = cart.find(i => this.key(i.product.id, i.combinationId) === k);
      return hit
        ? cart.map(i => this.key(i.product.id, i.combinationId) === k
            ? { ...i, quantity: i.quantity + 1 }
            : i)
        : [...cart, { product, combinationId, variantName, quantity: 1, idTaxRulesGroup, taxRate }];
    });
    this.persist();
  }

  remove(productId: number, combinationId = 0): void {
    const k = this.key(productId, combinationId);
    this.items.update(cart =>
      cart.filter(i => this.key(i.product.id, i.combinationId) !== k),
    );
    this.persist();
  }

  setQuantity(productId: number, combinationId: number, quantity: number): void {
    if (quantity <= 0) { this.remove(productId, combinationId); return; }
    const k = this.key(productId, combinationId);
    this.items.update(cart =>
      cart.map(i => this.key(i.product.id, i.combinationId) === k ? { ...i, quantity } : i),
    );
    this.persist();
  }

  /**
   * Adopt a specific PrestaShop cart id as the customer's active cart:
   * rebuilds the in-memory items from it and remembers it for future syncs.
   */
  async adoptPsCart(cartId: number): Promise<void> {
    const customerId = this.currentCustomerId;
    if (customerId === 0 || !cartId) return;

    this.restoring = true;
    try {
      await firstValueFrom(this.taxes.ensureLoaded());
      const cart = await firstValueFrom(this.psCart.getById(cartId));
      const rows = cart.associations?.cart_rows ?? [];
      const built = await Promise.all(rows.map(r => this.rowToItem(r)));
      this.items.set(built.filter((i): i is CartItem => i !== null));
      this.rememberPsCart(customerId, cartId);
    } finally {
      this.restoring = false;
    }
  }

  /**
   * Empties the in-memory cart. For a logged-in customer, syncs the empty
   * state to PrestaShop (cart record kept with no rows). Does NOT delete
   * the PS cart — use `deleteCart()` for that.
   */
  clear(): void {
    const customerId = this.currentCustomerId;
    this.items.set([]);
    if (customerId === 0) {
      localStorage.removeItem(STORAGE_KEY);
      if (this.syncTimer) { clearTimeout(this.syncTimer); this.syncTimer = null; }
    } else {
      this.scheduleSync();
    }
  }

  /**
   * Explicit destructive action: empties the cart AND deletes the PS cart
   * record for the current customer.
   */
  async deleteCart(): Promise<void> {
    const customerId = this.currentCustomerId;
    this.items.set([]);
    if (this.syncTimer) { clearTimeout(this.syncTimer); this.syncTimer = null; }
    if (customerId === 0) {
      localStorage.removeItem(STORAGE_KEY);
      return;
    }
    if (this.psCartId) {
      const id = this.psCartId;
      this.forgetPsCart(customerId);
      try { await firstValueFrom(this.psCart.delete(id)); } catch { /* ignore */ }
    }
  }

  // ── Per-line helpers ──────────────────────────────────────────────────────

  lineHt(item: CartItem): number {
    return parseFloat(item.product.price) * item.quantity;
  }

  lineTtc(item: CartItem): number {
    return parseFloat(item.product.price) * (1 + (item.taxRate || 0) / 100) * item.quantity;
  }

  unitHt(item: CartItem): number {
    return parseFloat(item.product.price);
  }

  unitTtc(item: CartItem): number {
    return parseFloat(item.product.price) * (1 + (item.taxRate || 0) / 100);
  }

  // ── Persistence dispatch ───────────────────────────────────────────────────

  private persist(): void {
    if (this.restoring) return;
    if (this.currentCustomerId === 0) {
      this.saveLocal(this.items());
    } else {
      this.scheduleSync();
    }
  }

  private scheduleSync(): void {
    if (this.syncTimer) clearTimeout(this.syncTimer);
    this.syncTimer = setTimeout(() => {
      this.syncTimer = null;
      void this.pushToPs();
    }, SYNC_DEBOUNCE_MS);
  }

  /** Re-evaluates each item's `taxRate` once the resolver has data. */
  private refreshTaxRates(): void {
    this.items.update(cart =>
      cart.map(i => ({
        ...i,
        taxRate: this.taxes.getRate(i.idTaxRulesGroup),
      })),
    );
  }

  /** Creates / updates / deletes the customer's PrestaShop cart to match memory. */
  private async pushToPs(): Promise<void> {
    const customerId = this.currentCustomerId;
    if (customerId === 0) return;
    const items = this.items();

    try {
      if (!items.length) {
        // Keep the PS cart record alive — it's only removed via deleteCart().
        // If we never created one yet, there is nothing to sync.
        if (!this.psCartId) return;
        const emptyPayload: CartWritable = {
          id_currency:   DEFAULT_CURRENCY,
          id_lang:       DEFAULT_LANG,
          id_shop:       DEFAULT_SHOP,
          id_shop_group: DEFAULT_SHOP_GROUP,
          id_customer:   customerId,
          associations:  { cart_rows: [] },
        };
        await firstValueFrom(this.psCart.update(this.psCartId, emptyPayload));
        return;
      }

      const payload: CartWritable = {
        id_currency:   DEFAULT_CURRENCY,
        id_lang:       DEFAULT_LANG,
        id_shop:       DEFAULT_SHOP,
        id_shop_group: DEFAULT_SHOP_GROUP,
        id_customer:   customerId,
        associations: {
          cart_rows: items.map(i => ({
            id_product:           i.product.id,
            id_product_attribute: i.combinationId,
            id_address_delivery:  0,
            id_customization:     0,
            quantity:             i.quantity,
          })),
        },
      };

      if (this.psCartId) {
        await firstValueFrom(this.psCart.update(this.psCartId, payload));
      } else {
        const created = await firstValueFrom(this.psCart.create(payload));
        this.rememberPsCart(customerId, created.id);
      }
    } catch {
      // PS / network failure — keep the in-memory cart; a later mutation retries.
    }
  }

  /** Rebuilds the in-memory cart from the customer's stored PrestaShop cart. */
  private async restoreFromPs(customerId: number): Promise<void> {
    const cartId = this.psCartIdFor(customerId);
    if (!cartId) { this.psCartId = null; this.items.set([]); return; }

    this.restoring = true;
    try {
      await firstValueFrom(this.taxes.ensureLoaded());
      const cart = await firstValueFrom(this.psCart.getById(cartId));
      const rows = cart.associations?.cart_rows ?? [];
      const built = await Promise.all(rows.map(r => this.rowToItem(r)));
      this.psCartId = cartId;
      this.items.set(built.filter((i): i is CartItem => i !== null));
    } catch {
      this.psCartId = null;
      this.items.set([]);
    } finally {
      this.restoring = false;
    }
  }

  private async rowToItem(row: {
    id_product: number;
    id_product_attribute: number;
    quantity: number;
  }): Promise<CartItem | null> {
    try {
      const product = await firstValueFrom(this.products.findById(row.id_product));
      let price = parseFloat(product.price) || 0;
      if (row.id_product_attribute) {
        try {
          const combo = await firstValueFrom(this.combos.getById(row.id_product_attribute));
          price += parseFloat(combo.price ?? '0') || 0;
        } catch { /* keep base price */ }
      }
      const idTaxRulesGroup = product.id_tax_rules_group;
      const taxRate = this.taxes.getRate(idTaxRulesGroup);
      const psProduct: PsProduct = {
        id:        product.id,
        name:      psLang(product.name),
        reference: product.reference ?? '',
        price:     String(price),
        active:    true,
      };
      return {
        product:       psProduct,
        combinationId: row.id_product_attribute,
        variantName:   '',
        quantity:      row.quantity,
        idTaxRulesGroup,
        taxRate,
      };
    } catch {
      return null;
    }
  }

  // ── helpers ────────────────────────────────────────────────────────────────

  private key(productId: number, combinationId: number): string {
    return `${productId}:${combinationId}`;
  }

  private saveLocal(cart: CartItem[]): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
  }

  private loadLocal(): CartItem[] {
    try {
      const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]') as Array<
        {
          product: PsProduct;
          combinationId?: number;
          variantName?: string;
          quantity?: number;
          idTaxRulesGroup?: number;
          taxRate?: number;
        }
      >;
      return raw.map(i => ({
        product:         i.product,
        combinationId:   i.combinationId ?? 0,
        variantName:     i.variantName   ?? '',
        quantity:        i.quantity      ?? 1,
        idTaxRulesGroup: i.idTaxRulesGroup,
        taxRate:         i.taxRate ?? this.taxes.getRate(i.idTaxRulesGroup),
      }));
    } catch {
      return [];
    }
  }

  private psCartMap(): Record<string, number> {
    try {
      return JSON.parse(localStorage.getItem(PS_MAP_KEY) ?? '{}') as Record<string, number>;
    } catch {
      return {};
    }
  }

  private psCartIdFor(customerId: number): number | null {
    return this.psCartMap()[customerId] ?? null;
  }

  private rememberPsCart(customerId: number, cartId: number): void {
    this.psCartId = cartId;
    const map = this.psCartMap();
    map[customerId] = cartId;
    localStorage.setItem(PS_MAP_KEY, JSON.stringify(map));
  }

  private forgetPsCart(customerId: number): void {
    this.psCartId = null;
    const map = this.psCartMap();
    delete map[customerId];
    localStorage.setItem(PS_MAP_KEY, JSON.stringify(map));
  }
}