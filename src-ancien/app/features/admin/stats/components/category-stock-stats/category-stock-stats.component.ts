import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import {
  CategoryService,
  OrderDetailService,
  OrderService,
  ProductService,
  StockAvailableService,
  ORDER_STATE_PAYMENT_ACCEPTED,
} from '@app/core';
import { LoaderComponent } from '@app/shared/components/loader/loader.component';
import { AlertComponent } from '@app/shared/components/alert/alert.component';
import { TableComponent, TableColumn } from '@app/shared/ui/table/table.component';

interface StockRow {
  categorie: string;
  physique: number;
  reserve: number;
  disponible: number;
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-category-stock-stats',
  standalone: true,
  imports: [LoaderComponent, AlertComponent, TableComponent],
  templateUrl: './category-stock-stats.component.html',
  styleUrl: './category-stock-stats.component.css',
})
export class CategoryStockStatsComponent implements OnInit {
  private readonly orderService = inject(OrderService);
  private readonly orderDetailService = inject(OrderDetailService);
  private readonly productService = inject(ProductService);
  private readonly categoryService = inject(CategoryService);
  private readonly stockService = inject(StockAvailableService);

  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly stockRows = signal<StockRow[]>([]);

  readonly stockColumns: TableColumn[] = [
    { key: 'categorie', label: 'Catégorie', sortable: true },
    { key: 'physique', label: 'Qté physique', align: 'center' },
    { key: 'reserve', label: 'Qté réservée', align: 'center' },
    { key: 'disponible', label: 'Qté disponible', align: 'center' },
  ];

  ngOnInit(): void {
    this.loadStockStats();
  }

  private async loadStockStats(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      const [orders, details, products, categories, stocks] =
        await Promise.all([
          firstValueFrom(this.orderService.getAllFull()),
          firstValueFrom(this.orderDetailService.getAllFull()),
          firstValueFrom(this.productService.getAllFull()),
          firstValueFrom(this.categoryService.getAllFull()),
          firstValueFrom(this.stockService.getAllFull()),
        ]);

      const categoriesFiltered = categories.filter((c) => c.id !== 1 && c.id !== 2);
      const stockByProduct = new Map<number, typeof stocks>();
      for (const stock of stocks) {
        const list = stockByProduct.get(stock.id_product) ?? [];
        list.push(stock);
        stockByProduct.set(stock.id_product, list);
      }
      const hasVariant = this.stockService.computeHasVariantSet(stocks);
      const stateByOrder = new Map<number, number | null>(
        orders.map((o) => [o.id, o.current_state ?? null]),
      );

      const isReserved = (idOrder: number): boolean =>
        stateByOrder.get(idOrder) === ORDER_STATE_PAYMENT_ACCEPTED;

      let totalPhysique = 0;
      let totalReserve = 0;

      const stockRows: StockRow[] = categoriesFiltered.map((cat) => {
        const idsProduits = new Set(
          products.filter((p) => p.id_category_default === cat.id).map((p) => p.id),
        );

        const relevantStocks = [...idsProduits].flatMap((productId) => {
          const productStocks = stockByProduct.get(productId) ?? [];
          if (hasVariant.has(productId)) {
            return productStocks.filter((s) => s.id_product_attribute !== 0);
          }
          return productStocks.filter((s) => s.id_product_attribute === 0);
        });

        const disponible = relevantStocks.reduce((sum, s) => sum + (s.quantity ?? 0), 0);
        const reserve = details
          .filter((d) => idsProduits.has(d.product_id ?? 0) && isReserved(d.id_order))
          .reduce((sum, d) => sum + (d.product_quantity ?? 0), 0);
        const physique = disponible + reserve;
        totalPhysique += physique;
        totalReserve += reserve;
        return {
          categorie: this.categoryName(cat),
          physique,
          reserve,
          disponible,
        };
      });
      stockRows.push({
        categorie: 'TOTAL',
        physique: totalPhysique,
        reserve: totalReserve,
        disponible: totalPhysique - totalReserve,
      });
      this.stockRows.set(stockRows);
    } catch (err: Error | unknown) {
      this.error.set(
        err instanceof Error ? err.message : 'Erreur lors du chargement des statistiques de stock',
      );
    } finally {
      this.loading.set(false);
    }
  }

  private categoryName(cat: { name: { id: number; value: string }[] }): string {
    return cat.name?.find((l) => l.id === 1)?.value ?? cat.name?.[0]?.value ?? '—';
  }
}
