import {
  Component,
  OnInit,
  signal,
  computed,
  inject,
  ChangeDetectionStrategy,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgOptimizedImage } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormControl } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { firstValueFrom } from 'rxjs';
import { ProductService, CategoryService, TaxResolverService } from '@app/core/services';
import { ImageApi } from '@app/core/api';
import { AlertComponent } from '@app/shared/components/alert/alert.component';
import { Product, Category } from '@app/core/models';
import { psLang, formatCurrency, dateDiffInDays, formatDateToISO, useLoader } from '@app/core/utils';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,

  selector: 'app-catalog',
  standalone: true,
  imports: [RouterLink, ReactiveFormsModule, AlertComponent, NgOptimizedImage],
  templateUrl: './catalog.component.html',
  styleUrl: './catalog.component.css',
})
export class CatalogComponent implements OnInit {
  private readonly productService = inject(ProductService);
  private readonly categoryService = inject(CategoryService);
  private readonly taxResolver = inject(TaxResolverService);
  private readonly imageApi = inject(ImageApi);
  private readonly loader = useLoader();

  readonly products = signal<Product[]>([]);
  readonly categories = signal<Category[]>([]);
  readonly loading = this.loader.loading;
  readonly error = this.loader.error;

  readonly filtersForm = new FormGroup({
    search: new FormControl('', { nonNullable: true }),
    categoryId: new FormControl<number | null>(null),
    priceMin: new FormControl<number | null>(null),
    priceMax: new FormControl<number | null>(null),
  });

  readonly filters = toSignal(this.filtersForm.valueChanges, {
    initialValue: this.filtersForm.value,
  });

  readonly filtered = computed(() => {
    const filters = this.filters();
    const term = (filters.search || '').toLowerCase().trim();
    const catId = filters.categoryId ? Number(filters.categoryId) : null;
    const pMin = filters.priceMin ? Number(filters.priceMin) : null;
    const pMax = filters.priceMax ? Number(filters.priceMax) : null;
    return this.products().filter((p) => {
      const name = psLang(p.name);
      const ref = p.reference ?? '';
      if (term && !name.toLowerCase().includes(term) && !ref.toLowerCase().includes(term))
        return false;
      if (catId !== null && p.id_category_default !== catId) return false;
      const price = parseFloat(p.price || '0');
      if (pMin !== null && price < pMin) return false;
      if (pMax !== null && price > pMax) return false;
      return true;
    });
  });

  readonly productPriceMap = computed(() => {
    const map = new Map<number, string>();
    this.products().forEach(p => {
      const price = parseFloat(p.price || '0');
      map.set(p.id, formatCurrency(price, 2));
    });
    return map;
  });

  readonly productPriceTtcMap = computed(() => {
    const map = new Map<number, string>();
    this.products().forEach(p => {
      const price = parseFloat(p.price || '0');
      const ttc = this.taxResolver.toTtc(price, p.id_tax_rules_group);
      map.set(p.id, formatCurrency(ttc, 2));
    });
    return map;
  });

  ngOnInit(): void {
    void this.loader.run(async () => {
      await firstValueFrom(this.taxResolver.ensureLoaded());
      const psProducts = await firstValueFrom(
        this.productService.getAllFull({ 'filter[active]': 1 }),
      );
      this.products.set(psProducts);

      const catIds = [
        ...new Set(
          psProducts
            .map((p) => p.id_category_default)
            .filter((id): id is number => id !== undefined && id > 2),
        ),
      ];
      const cats = (
        await Promise.all(
          catIds.map((id) => firstValueFrom(this.categoryService.getById(id)).catch(() => null)),
        )
      ).filter((c): c is Category => c !== null);
      this.categories.set(cats.sort((a, b) => {
        const nameA = psLang(a.name);
        const nameB = psLang(b.name);
        return nameA.localeCompare(nameB);
      }));
    });
  }

  getProductPrice(productId: number): string {
    return this.productPriceMap().get(productId) || '';
  }

  getProductPriceTtc(productId: number): string {
    return this.productPriceTtcMap().get(productId) || '';
  }

  resetFilters(): void {
    this.filtersForm.reset({ search: '', categoryId: null, priceMin: null, priceMax: null });
  }

  badge(p: Product): 'hot' | 'new' | null {
    const dateAvail = p.available_date?.slice(0, 10);
    if (!dateAvail) return null;

    const todayStr = formatDateToISO(new Date());
    const days = dateDiffInDays(dateAvail, todayStr);

    if (days < 0) return null; // Product availability is in the future
    if (days < 2) return 'hot'; // Added today
    if (days <= 7) return 'new'; // Added within the last week

    return null;
  }

  getName(obj: any): string {
    return psLang(obj.name);
  }

  getProductImageUrl(p: Product): string | undefined {
    return p.id_default_image ? this.imageApi.productImageUrl(p.id, p.id_default_image) : undefined;
  }

  hasCombinations(p: Product): boolean {
    return (p.associations?.combinations?.length ?? 0) > 0;
  }

}
