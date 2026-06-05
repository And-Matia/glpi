import {
  Component,
  OnInit,
  inject,
  signal,
  computed,
  ChangeDetectionStrategy,
} from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import {
  ProductService,
  CombinationService,
  StockAvailableService,
} from '@app/core/services';
import { StoreCheckoutService } from '../services/store-checkout.service';
import { CartService } from '../cart/cart.service';
import { Order } from '@app/core/models';
import { PsProduct } from '@app/core/models/ps/product.model';
import { psLang } from '@app/core/utils';

interface VerifyRow {
  productId:     number;
  combinationId: number;
  label:         string;
  reference:     string;
  requested:     number;
  available:     number;
  insufficient:  boolean;
  psProduct:     PsProduct;
  variantName:   string;
  idTaxRulesGroup?: number;
}

@Component({
  selector: 'app-verify-duplication',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  templateUrl: './verify-duplication.component.html',
  styleUrl: './verify-duplication.component.css',
})
export class VerifyDuplicationComponent implements OnInit {
  private readonly route        = inject(ActivatedRoute);
  private readonly router       = inject(Router);
  private readonly checkout     = inject(StoreCheckoutService);
  private readonly products     = inject(ProductService);
  private readonly combinations = inject(CombinationService);
  private readonly stocks       = inject(StockAvailableService);
  private readonly cart         = inject(CartService);

  readonly loading    = signal(true);
  readonly error      = signal<string | null>(null);
  readonly rows       = signal<VerifyRow[]>([]);
  readonly multiplier = signal(1);
  readonly orderRef   = signal('');
  readonly adding     = signal(false);

  readonly hasShortage = computed(() => this.rows().some(r => r.insufficient));

  async ngOnInit(): Promise<void> {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    const mult = Math.max(1, Number(this.route.snapshot.queryParamMap.get('multiplier') ?? 1));
    this.multiplier.set(mult);

    if (!id) {
      this.error.set('Commande introuvable.');
      this.loading.set(false);
      return;
    }

    try {
      const order = await firstValueFrom(this.checkout.getOrder(id));
      if (!order) {
        this.error.set('Commande introuvable.');
        return;
      }
      this.orderRef.set(order.reference || `#${order.id}`);
      await this.buildRows(order, mult);
    } catch {
      this.error.set('Erreur lors du chargement.');
    } finally {
      this.loading.set(false);
    }
  }

  private async buildRows(order: Order, multiplier: number): Promise<void> {
    const orderRows = order.associations?.order_rows ?? [];
    const built: VerifyRow[] = [];

    for (const r of orderRows) {
      const requested = r.product_quantity * multiplier;
      let product;
      try {
        product = await firstValueFrom(this.products.findById(r.product_id));
      } catch {
        continue;
      }
      if (!product) continue;

      const combinationId = r.product_attribute_id || 0;
      let price = parseFloat(product.price || '0') || 0;
      let variantName = '';
      let reference = product.reference ?? '';

      if (combinationId) {
        try {
          const combo = await firstValueFrom(this.combinations.getById(combinationId));
          price += parseFloat(combo.price || '0') || 0;
          if (combo.reference) reference = combo.reference;
          if (combo.associations?.product_option_values?.length) {
            variantName = `Variant #${combo.id}`;
          }
        } catch { /* keep base */ }
      }

      let available = 0;
      try {
        const list = await firstValueFrom(
          this.stocks.getAllFull({ 'filter[id_product]': r.product_id }),
        );
        const match = list.find(
          s => s.id_product === r.product_id && s.id_product_attribute === combinationId,
        );
        available = match?.quantity ?? 0;
      } catch { /* available stays 0 */ }

      const psProduct: PsProduct = {
        id:        product.id,
        name:      psLang(product.name) || r.product_name || '',
        reference: product.reference ?? '',
        price:     String(price),
        active:    product.active ?? true,
      };

      built.push({
        productId:    r.product_id,
        combinationId,
        label:        r.product_name || psLang(product.name) || `#${r.product_id}`,
        reference,
        requested,
        available,
        insufficient: available < requested,
        psProduct,
        variantName,
        idTaxRulesGroup: product.id_tax_rules_group,
      });
    }

    this.rows.set(built);
  }

  async addToCart(): Promise<void> {
    if (this.adding()) return;
    this.adding.set(true);
    try {
      for (const row of this.rows()) {
        for (let i = 0; i < row.requested; i++) {
          this.cart.add(row.psProduct, row.combinationId, row.variantName, row.idTaxRulesGroup);
        }
      }
      await this.router.navigate(['/cart']);
    } finally {
      this.adding.set(false);
    }
  }
}
