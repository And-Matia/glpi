import {
  Component,
  OnInit,
  inject,
  signal,
  computed,
  ChangeDetectionStrategy,
} from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { NgOptimizedImage } from '@angular/common';
import { firstValueFrom } from 'rxjs';
import { CartService } from '../cart/cart.service';
import { ProductOptionValueService, StockAvailableService,CombinationService,ProductService, TaxResolverService } from '@app/core/services';
import { ImageApi } from '@app/core/api';
import { Product, PsProduct, Combination } from '@app/core/models';
import { psLang, useLoader, formatCurrency } from '@app/core/utils';
import { AlertComponent } from '@app/shared/components/alert/alert.component';

interface Variant {
  combinationId: number;
  label: string;
  priceImpact: number;
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,

  selector: 'app-product-detail',
  standalone: true,
  imports: [RouterLink, NgOptimizedImage],
  templateUrl: './product-detail.component.html',
  styleUrl: './product-detail.component.css',
})
export class ProductDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly cartService = inject(CartService);
  private readonly productService = inject(ProductService);
  private readonly combinationService = inject(CombinationService);
  private readonly productOptionValueSvc = inject(ProductOptionValueService);
  private readonly stockService = inject(StockAvailableService);
  private readonly taxResolver = inject(TaxResolverService);
  readonly imageApi = inject(ImageApi);

  // stock: id_product_attribute → quantity (0 = simple product stock)
  private readonly stockMap = signal<Map<number, number>>(new Map());

  private readonly loader = useLoader();

  readonly product = signal<Product | null>(null);
  readonly variants = signal<Variant[]>([]);
  readonly selectedVariant = signal<Variant | null>(null);
  readonly quantity = signal(1);
  readonly loading = this.loader.loading;
  readonly error = this.loader.error;
  readonly added = signal(false);

  readonly effectivePrice = computed(() => {
    const p = this.product();
    if (!p) return 0;
    const basePrice = parseFloat(p.price || '0') || 0;
    return basePrice + (this.selectedVariant()?.priceImpact ?? 0);
  });

  readonly effectivePriceFormatted = computed(() =>
    formatCurrency(this.effectivePrice(), 2)
  );

  readonly effectivePriceTtc = computed(() => {
    const p = this.product();
    if (!p) return 0;
    return this.taxResolver.toTtc(this.effectivePrice(), p.id_tax_rules_group);
  });

  readonly effectivePriceTtcFormatted = computed(() =>
    formatCurrency(this.effectivePriceTtc(), 2)
  );

  readonly stockQty = computed<number | null>(() => {
    const map = this.stockMap();
    if (!map.size) return null;
    const variants = this.variants();
    if (!variants.length) {
      // Simple product: stock for attribute 0
      return map.get(0) ?? null;
    }
    const sel = this.selectedVariant();
    if (!sel) return null;
    return map.get(sel.combinationId) ?? null;
  });

  readonly canAdd = computed(
    () => !!this.product() && (!this.variants().length || !!this.selectedVariant()),
  );

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    void this.loader.run(async () => {
      await firstValueFrom(this.taxResolver.ensureLoaded());
      const p = await firstValueFrom(this.productService.getById(id));
      this.product.set(p);

      const stocks = await firstValueFrom(
        this.stockService.getAllFull({ 'filter[id_product]': id }),
      );
      this.stockMap.set(new Map(stocks.map((s) => [s.id_product_attribute, s.quantity])));

      const comboIds = p.associations?.combinations?.map((c) => c.id) ?? [];
      if (comboIds.length) {
        const combos = await Promise.all(
          comboIds.map((cid) => firstValueFrom(this.combinationService.getById(cid))),
        );
        const variants = await Promise.all(
          combos.map(async (combo) => {
            const ovIds = combo.associations?.product_option_values?.map((v) => v.id) ?? [];
            const ovs = await Promise.all(
              ovIds.map((ovId) => firstValueFrom(this.productOptionValueSvc.getById(ovId))),
            );
            const label =
              ovs.map((ov) => psLang(ov.name)).join(' / ') || `Variant #${combo.id}`;
            return {
              combinationId: combo.id,
              label,
              priceImpact: parseFloat(combo.price || '0'),
            };
          }),
        );
        this.variants.set(variants);
      }
    });
  }

  selectVariant(v: Variant): void {
    this.selectedVariant.set(this.selectedVariant()?.combinationId === v.combinationId ? null : v);
  }

  decQty(): void {
    if (this.quantity() > 1) this.quantity.update((q) => q - 1);
  }
  incQty(): void {
    this.quantity.update((q) => q + 1);
  }

  addToCart(): void {
    const p = this.product();
    if (!p) return;
    const v = this.selectedVariant();
    const psProduct: PsProduct = {
      id: p.id,
      name: psLang(p.name),
      reference: p.reference ?? '',
      price: String(this.effectivePrice()),
      active: p.active ?? true,
      imageUrl: p.id_default_image ? this.imageApi.productImageUrl(p.id, p.id_default_image) : undefined,
    };
    for (let i = 0; i < this.quantity(); i++) {
      this.cartService.add(psProduct, v?.combinationId ?? 0, v?.label ?? '', p.id_tax_rules_group);
    }
    this.added.set(true);
    setTimeout(() => this.added.set(false), 2500);
  }

  getName(p: Product): string {
    return psLang(p.name);
  }

  getDescription(p: Product): string {
    return psLang(p.description) || psLang(p.description_short);
  }

}
