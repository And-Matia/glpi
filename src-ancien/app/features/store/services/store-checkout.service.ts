import { Injectable, inject } from '@angular/core';
import { Observable, of, switchMap, map, catchError, forkJoin } from 'rxjs';
import {
  AddressService,
  CartService,
  OrderService,
  OrderHistoryService,
  ProductService,
  CombinationService,
  StockMovementService,
  TaxResolverService,
} from '@app/core/services';
import { Order, OrderWritable, StockMovementWritable } from '@app/core/models';
import { psLang } from '@app/core/utils';
import { StockMvtReason, ORDER_STATE_PAYMENT_ACCEPTED } from '@app/core/constants';
import {
  DEFAULT_LANG,
  DEFAULT_CURRENCY,
  DEFAULT_CARRIER,
  DEFAULT_SHOP,
  DEFAULT_SHOP_GROUP,
  DEFAULT_EMPLOYEE,
} from '@app/core/constants';
import { CartItem } from '../cart/cart.service';

// Storefront sells with a single payment method, no shipping fee.
const PAYMENT_MODULE = 'ps_checkpayment';
const PAYMENT_LABEL = 'Paiement à la livraison';

export interface CheckoutInput {
  /** Existing PrestaShop customer id (storefront requires a real customer). */
  idCustomer: number;
  fullName: string;
  phone: string;
  city: string;
  items: CartItem[];
}

/**
 * Orchestrates a storefront purchase against PrestaShop: it resolves the
 * delivery address, creates the cart, then the order — mirroring the Import 3
 * pipeline but for a single live order. Payment is always "paiement à la
 * livraison" and there is no shipping fee.
 */
@Injectable({ providedIn: 'root' })
export class StoreCheckoutService {
  private readonly addressService = inject(AddressService);
  private readonly cartService = inject(CartService);
  private readonly orderService = inject(OrderService);
  private readonly orderHistoryService = inject(OrderHistoryService);
  private readonly productService = inject(ProductService);
  private readonly combinationService = inject(CombinationService);
  private readonly stockMovementService = inject(StockMovementService);
  private readonly taxResolver = inject(TaxResolverService);

  // ── Place an order ─────────────────────────────────────────────────────────

  /** Creates a real PrestaShop order and returns its id. */
  placeOrder(input: CheckoutInput): Observable<number> {
    return this.addressService
      .getOrCreate(input.idCustomer, input.city, input.fullName)
      .pipe(
        switchMap((idAddress) =>
          this.createCart(input, idAddress).pipe(
            switchMap((idCart) => this.createOrder(input, idAddress, idCart)),
          ),
        ),
        switchMap((idOrder) =>
          this.recordHistory(idOrder, ORDER_STATE_PAYMENT_ACCEPTED).pipe(
            switchMap(() => this.logStockMovements(input.items)),
            map(() => idOrder),
          ),
        ),
      );
  }

  private logStockMovements(items: CartItem[]): Observable<void> {
    if (!items.length) return of(void 0);
    return forkJoin(
      items.map((i) => {
        const payload: StockMovementWritable = {
          id_stock: 1,
          id_stock_mvt_reason: StockMvtReason.SORTIE_COMMANDE,
          id_employee: DEFAULT_EMPLOYEE,
          id_product: i.product.id,
          id_product_attribute: i.combinationId,
          id_warehouse: null,
          id_currency: null,
          id_order: null,
          id_supply_order: null,
          management_type: '',
          product_name: [],
          ean13: '',
          upc: '',
          reference: '',
          mpn: '',
          physical_quantity: i.quantity,
          sign: -1,
          last_wa: '0',
          current_wa: '0',
          price_te: '0',
          date_add: new Date().toISOString().replace('T', ' ').substring(0, 19),
        };
        return this.stockMovementService.create(payload);
      }),
    ).pipe(map(() => void 0), catchError(() => of(void 0)));
  }

  private createCart(input: CheckoutInput, idAddress: number): Observable<number> {
    const cart_rows = input.items.map((i) => ({
      id_product: i.product.id,
      id_product_attribute: i.combinationId,
      id_address_delivery: idAddress,
      id_customization: 0,
      quantity: i.quantity,
    }));

    return this.cartService
      .create({
        id_currency: DEFAULT_CURRENCY,
        id_lang: DEFAULT_LANG,
        id_shop: DEFAULT_SHOP,
        id_shop_group: DEFAULT_SHOP_GROUP,
        id_customer: input.idCustomer,
        id_address_delivery: idAddress,
        id_address_invoice: idAddress,
        id_carrier: DEFAULT_CARRIER,
        associations: { cart_rows },
      })
      .pipe(map((cart) => cart.id));
  }

  private createOrder(
    input: CheckoutInput,
    idAddress: number,
    idCart: number,
  ): Observable<number> {
    // Cart items hold the HT price; per-item tax rate gives us TTC.
    const order_rows = input.items.map((i) => {
      const ht = parseFloat(i.product.price) || 0;
      const ttc = ht * (1 + (i.taxRate || 0) / 100);
      const unitHt = ht.toFixed(6);
      const unitTtc = ttc.toFixed(6);
      const name = i.variantName ? `${i.product.name} - ${i.variantName}` : i.product.name;
      return {
        id: 0,
        product_id: i.product.id,
        product_attribute_id: i.combinationId,
        product_quantity: i.quantity,
        product_name: name,
        product_reference: i.product.reference ?? '',
        product_ean13: '',
        product_isbn: '',
        product_upc: '',
        product_price: unitHt,
        id_customization: 0,
        unit_price_tax_incl: unitTtc,
        unit_price_tax_excl: unitHt,
      };
    });

    const totalHt = input.items
      .reduce((sum, i) => sum + (parseFloat(i.product.price) || 0) * i.quantity, 0);
    const totalTtc = input.items.reduce(
      (sum, i) =>
        sum + (parseFloat(i.product.price) || 0) * (1 + (i.taxRate || 0) / 100) * i.quantity,
      0,
    );
    const totalHtStr = totalHt.toFixed(6);
    const totalTtcStr = totalTtc.toFixed(6);

    const payload: OrderWritable = {
      id_address_delivery: idAddress,
      id_address_invoice: idAddress,
      id_cart: idCart,
      id_currency: DEFAULT_CURRENCY,
      id_shop: DEFAULT_SHOP,
      id_shop_group: DEFAULT_SHOP_GROUP,
      id_lang: DEFAULT_LANG,
      id_customer: input.idCustomer,
      id_carrier: DEFAULT_CARRIER,
      module: PAYMENT_MODULE,
      payment: PAYMENT_LABEL,
      total_paid: totalTtcStr,
      total_paid_real: totalTtcStr,
      total_paid_tax_incl: totalTtcStr,
      total_paid_tax_excl: totalHtStr,
      total_products: totalHtStr,
      total_products_wt: totalTtcStr,
      conversion_rate: '1',
      current_state: ORDER_STATE_PAYMENT_ACCEPTED,
      associations: { order_rows },
    };

    return this.orderService.create(payload).pipe(
      map((order) => order.id),
      // PS sometimes returns 500 from a module hook although the order persisted;
      // recover by looking it up via its cart.
      catchError(() =>
        this.orderService.getAllFull({ 'filter[id_cart]': idCart }).pipe(
          switchMap((existing) => {
            if (!existing.length) throw new Error("La commande n'a pas pu être créée.");
            return of(existing[0].id);
          }),
        ),
      ),
    );
  }

  private recordHistory(idOrder: number, stateId: number): Observable<void> {
    return this.orderHistoryService
      .create({ id_order: idOrder, id_order_state: stateId })
      .pipe(
        map(() => void 0),
        catchError(() => of(void 0)),
      );
  }

  // ── Read orders back ───────────────────────────────────────────────────────

  /** Fetches one full order. */
  getOrder(id: number): Observable<Order | null> {
    return this.orderService.getById(id).pipe(
      catchError(() => of(null)),
    );
  }

  /** Lists a customer's full orders, most recent first. */
  getOrdersByCustomerFull(idCustomer: number): Observable<Order[]> {
    if (!idCustomer) return of([]);
    return this.orderService.getAllFull({ 'filter[id_customer]': idCustomer }).pipe(
      map((orders) =>
        orders.sort((a, b) => (b.date_add ?? '').localeCompare(a.date_add ?? '')),
      ),
      catchError(() => of([])),
    );
  }

  // ── Read the customer's carts ──────────────────────────────────────────────

  /** Fetches the customer's most recent PrestaShop cart with resolved product data. */
  getLastCart(idCustomer: number): Observable<{ cart: any; lines: any[] } | null> {
    if (!idCustomer) return of(null);
    return this.taxResolver.ensureLoaded().pipe(
      switchMap(() =>
        this.cartService.getAllFull({ 'filter[id_customer]': idCustomer }),
      ),
      switchMap((carts) => {
        if (!carts.length) return of(null);
        const cart = [...carts].sort(
          (a, b) => (b.date_add ?? '').localeCompare(a.date_add ?? ''),
        )[0];
        const rows = cart.associations?.cart_rows ?? [];
        if (!rows.length) {
          return of({ cart, lines: [] });
        }
        return forkJoin(rows.map((r) => this.resolveCartLine(r))).pipe(
          map((lines) => ({ cart, lines })),
        );
      }),
      catchError(() => of(null)),
    );
  }

  private resolveCartLine(row: {
    id_product: number;
    id_product_attribute: number;
    quantity: number;
  }): Observable<any> {
    return this.productService.findById(row.id_product).pipe(
      switchMap((product) => {
        const name = psLang(product.name);
        const base = parseFloat(product.price) || 0;
        const taxRate = this.taxResolver.getRate(product.id_tax_rules_group);
        if (!row.id_product_attribute) {
          return of({ name, quantity: row.quantity, unitPrice: base, taxRate });
        }
        return this.combinationService.getById(row.id_product_attribute).pipe(
          map((combo) => ({
            name,
            quantity: row.quantity,
            unitPrice: base + (parseFloat(combo.price ?? '0') || 0),
            taxRate,
          })),
          catchError(() =>
            of({ name, quantity: row.quantity, unitPrice: base, taxRate }),
          ),
        );
      }),
      catchError(() =>
        of({ name: `Produit #${row.id_product}`, quantity: row.quantity, unitPrice: 0, taxRate: 0 }),
      ),
    );
  }

}
