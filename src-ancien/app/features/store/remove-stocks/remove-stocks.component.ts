import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import {
  AuthService,
  Category,
  CategoryService,
  Combination,
  CombinationService,
  Product,
  ProductService,
  psLang,
  StockAvailable,
  StockAvailableService,
  useLoader,
} from '@app/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { firstValueFrom } from 'rxjs';
import {
  AddingSummaryRow,
  RemovalSummaryRow,
  StockRemovalSummaryComponent,
} from './stock-removal-summary/stock-removal-summary.component';

@Component({
  selector: 'app-remove-stocks',
  imports: [ReactiveFormsModule, StockRemovalSummaryComponent],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './remove-stocks.component.html',
  styleUrl: './remove-stocks.component.css',
})
class RemoveStocksComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly loader = useLoader();
  private readonly categoryService = inject(CategoryService);
  private readonly productService = inject(ProductService);
  private readonly stockService = inject(StockAvailableService);
  private readonly combinationService = inject(CombinationService);

  readonly categories = signal<Category[]>([]);
  readonly stocks = signal<StockAvailable[]>([]);
  readonly combinations = signal<Combination[]>([]);
  readonly products = signal<Product[]>([]);
  readonly loading = this.loader.loading;
  readonly error = this.loader.error;
  readonly verified = signal(false);
  readonly showSummary = signal(false);
  readonly summaryRowsToRemove = signal<RemovalSummaryRow[]>([]);
  readonly summaryRowsToAdd = signal<AddingSummaryRow[]>([]);

  readonly loginForm = new FormGroup({
    password: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
  });

  readonly categoriesForm = new FormGroup({
    categoryIdToAdd: new FormControl<number | 'all' | null>(null, Validators.required),
    categoryIdToRemove: new FormControl<number | 'all' | null>(null, Validators.required),
    toRemove: new FormControl<number | null>(null, [Validators.required, Validators.min(0)]),
    toAdd: new FormControl<number | null>(null, [Validators.required, Validators.min(1)]),
    stockLimit: new FormControl<number | null>(null, []),
  });

  readonly productsInCategoryToAdd = computed(() => {
    const categoryId = this.categoriesForm.getRawValue().categoryIdToAdd;
    if (!categoryId) return [];
    if (categoryId === 'all') return this.products();
    return this.products().filter((p) =>
      (p.associations?.categories ?? []).some((c) => Number(c.id) === categoryId),
    );
  });

  readonly productsInCategoryToRemove = computed(() => {
    const categoryId = this.categoriesForm.getRawValue().categoryIdToRemove;
    if (!categoryId) return [];
    if (categoryId === 'all') return this.products();
    return this.products().filter((p) =>
      (p.associations?.categories ?? []).some((c) => Number(c.id) === categoryId),
    );
  });

  ngOnInit(): void {
    void this.loader.run(async () => {
      const [psProducts, psStocks, psCombination] = await Promise.all([
        firstValueFrom(this.productService.getAllFull({ 'filter[active]': 1 })),
        firstValueFrom(this.stockService.getAllFull()),
        firstValueFrom(this.combinationService.getAllFull()),
      ]);
      this.products.set(psProducts);
      this.combinations.set(psCombination);
      this.stocks.set(psStocks);

      const catIds = [
        ...new Set(
          psProducts.flatMap((p) =>
            (p.associations?.categories ?? [])
              .map((c) => Number(c.id))
              .filter((id) => Number.isFinite(id) && id > 2),
          ),
        ),
      ];
      const cats = (
        await Promise.all(
          catIds.map((id) => firstValueFrom(this.categoryService.getById(id)).catch(() => null)),
        )
      ).filter((c): c is Category => c !== null);
      this.categories.set(cats.sort((a, b) => psLang(a.name).localeCompare(psLang(b.name))));
    });
  }

  getName(obj: Category): string {
    return psLang(obj.name);
  }

  onSubmit(): void {
    if (this.loginForm.invalid) return;
    this.error.set('');
    this.loading.set(true);
    const { password } = this.loginForm.getRawValue();
    this.auth
      .login('admin', password)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((session) => {
        this.loading.set(false);
        if (session) {
          this.verified.set(true);
        } else {
          this.error.set('Identifiant ou mot de passe incorrect.');
        }
      });
  }

  onRemove(): void {
    if (this.categoriesForm.invalid) return;
    const { categoryIdToAdd, toAdd, stockLimit } = this.categoriesForm.getRawValue();
    const { categoryIdToRemove, toRemove } = this.categoriesForm.getRawValue();
    if (!categoryIdToRemove || toRemove == null || toRemove <= 0) return;

    void this.loader.run(async () => {
      const productInCatToAdd = this.productsInCategoryToAdd();
      const productsInCatToRemove = this.productsInCategoryToRemove();

      const combinationById = new Map(this.combinations().map((c) => [c.id, c]));
      const categoryById = new Map(this.categories().map((c) => [c.id, c]));
      const variantLabels = await firstValueFrom(this.combinationService.getVariantLabelMap());
      const allStocks = this.stocks();

      const combinationsByProduct = new Map<number, Combination[]>();
      for (const c of this.combinations()) {
        const list = combinationsByProduct.get(c.id_product) ?? [];
        list.push(c);
        combinationsByProduct.set(c.id_product, list);
      }

      const resolveProductId = (s: StockAvailable): number => {
        if (s.id_product) return s.id_product;
        if (s.id_product_attribute > 0) {
          return combinationById.get(s.id_product_attribute)?.id_product ?? 0;
        }
        return 0;
      };

      const findStock = (idProduct: number, idAttr: number): StockAvailable | undefined =>
        allStocks.find(
          (s) => resolveProductId(s) === idProduct && s.id_product_attribute === idAttr,
        );

      const rowsToRemove: RemovalSummaryRow[] = [];
      const rowsToAdd : AddingSummaryRow[] = [];

      const selectedCategoryNameToAdd =
        categoryIdToAdd === 'all'
          ? null
          : (() => {
              const sel = categoryById.get(categoryIdToAdd as number);
              return sel ? psLang(sel.name) : `Catégorie #${categoryIdToAdd}`;
            })();

      const selectedCategoryNameToRemove =
        categoryIdToRemove === 'all'
          ? null
          : (() => {
              const sel = categoryById.get(categoryIdToRemove);
              return sel ? psLang(sel.name) : `Catégorie #${categoryIdToRemove}`;
            })();

      for (const product of productInCatToAdd) {
        const productCombinations = combinationsByProduct.get(product.id) ?? [];
        const productCatIds = (product.associations?.categories ?? [])
          .map((c) => Number(c.id))
          .filter((id) => Number.isFinite(id) && id > 2);
        const productCatNames = productCatIds
          .map((id) => {
            const c = categoryById.get(id);
            return c ? psLang(c.name) : null;
          })
          .filter((n): n is string => n !== null)
          .join(', ');
        const categoryName = selectedCategoryNameToAdd ?? (productCatNames || '—');
        const productName = psLang(product.name);

        const targets: { idAttr: number; combination?: Combination }[] =
          productCombinations.length > 0
            ? productCombinations.map((c) => ({ idAttr: c.id, combination: c }))
            : [{ idAttr: 0 }];

        for (const target of targets) {
          const stock = findStock(product.id, target.idAttr);
          if (!stock) continue;

          const before = stock.quantity || 0;
          const ToAdd = toAdd ? toAdd : 0;
          let newQty: number;
          if (stockLimit !== null && stockLimit !== undefined) {
            if (before >= stockLimit) {
              newQty = before;
            } else {
              newQty = Math.min(stockLimit, before + ToAdd);
            }
          } else {
            newQty = Math.max(0, before + ToAdd);
          }
          const actuallyAdded = newQty - before;
          if (actuallyAdded === 0) continue;

          await this.stockService.adjustQuantity(product.id, target.idAttr, before, newQty);

          const variantLabel =
            target.idAttr > 0
              ? variantLabels.get(target.idAttr) || `Variant #${target.idAttr}`
              : 'Principal';
          const reference = target.combination?.reference || product.reference || '';

          rowsToAdd.push({
            productName,
            variantLabel,
            reference,
            categoryName,
            amountRequested: ToAdd,
            amountAdded: actuallyAdded,
          });
        }
      }

      for (const product of productsInCatToRemove) {
        const newStock = await firstValueFrom(this.stockService.getAllFull());
        this.stocks.set(newStock);
        const productCombinations = combinationsByProduct.get(product.id) ?? [];
        const productCatIds = (product.associations?.categories ?? [])
          .map((c) => Number(c.id))
          .filter((id) => Number.isFinite(id) && id > 2);
        const productCatNames = productCatIds
          .map((id) => {
            const c = categoryById.get(id);
            return c ? psLang(c.name) : null;
          })
          .filter((n): n is string => n !== null)
          .join(', ');
        const categoryName = selectedCategoryNameToRemove ?? (productCatNames || '—');
        const productName = psLang(product.name);

        const targets: { idAttr: number; combination?: Combination }[] =
          productCombinations.length > 0
            ? productCombinations.map((c) => ({ idAttr: c.id, combination: c }))
            : [{ idAttr: 0 }];

        for (const target of targets) {
          const stock = findStock(product.id, target.idAttr);
          if (!stock) continue;

          const before = stock.quantity || 0;
          const newQty = before < 0 ? 0 : Math.max(0, before - toRemove);
          const actuallyRemoved = before - newQty;

          if (before < 0) {
            await this.stockService.setQuantity(product.id, target.idAttr, 0);
          } else {
            await this.stockService.adjustQuantity(product.id, target.idAttr, before, newQty);
          }

          const variantLabel =
            target.idAttr > 0
              ? variantLabels.get(target.idAttr) || `Variant #${target.idAttr}`
              : 'Principal';
          const reference = target.combination?.reference || product.reference || '';

          rowsToRemove.push({
            productName,
            variantLabel,
            reference,
            categoryName,
            amountRequested: toRemove,
            amountRemoved: actuallyRemoved,
          });
        }
      }

      rowsToRemove.sort(
        (a, b) =>
          a.categoryName.localeCompare(b.categoryName, 'fr') ||
          a.productName.localeCompare(b.productName, 'fr') ||
          a.variantLabel.localeCompare(b.variantLabel, 'fr'),
      );

      this.summaryRowsToAdd.set(rowsToAdd);
      this.summaryRowsToRemove.set(rowsToRemove);
      this.showSummary.set(true);
    });
  }
}

export default RemoveStocksComponent;
