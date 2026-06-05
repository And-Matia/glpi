import { Component, inject, OnInit, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { 
  ProductService, 
  OrderDetailService, 
  OrderService, 
  StockAvailableService,
  ORDER_STATE_PAYMENT_ACCEPTED,
  ORDER_STATE_DELIVERED 
} from '@app/core';
import { Product } from '@app/core/models/ps/product.model';
import { TableComponent, TableColumn } from '@app/shared/ui/table/table.component';
import { TableCellDirective } from '@app/shared/ui/table/table-cell.directive';
import { BadgeComponent } from '@app/shared/ui/badge/badge.component';
import { LoaderComponent } from '@app/shared/components/loader/loader.component';
import { AlertComponent } from '@app/shared/components/alert/alert.component';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-product-table',
  standalone: true,
  imports: [
    CommonModule,
    TableComponent,
    TableCellDirective,
    BadgeComponent,
    LoaderComponent,
    AlertComponent
  ],
  templateUrl: './product-table.component.html',
  styleUrl: './product-table.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProductTableComponent implements OnInit {
  private readonly productService = inject(ProductService);
  private readonly orderService = inject(OrderService);
  private readonly orderDetailService = inject(OrderDetailService);
  private readonly stockService = inject(StockAvailableService);

  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  private readonly _products = signal<any[]>([]);

  readonly columns: TableColumn[] = [
    { key: 'name', label: 'Produit', sortable: true, searchable: true },
    { key: 'reference', label: 'Référence', sortable: true },
    { key: 'sales', label: 'Ventes', sortable: true, align: 'center' },
    { key: 'stock', label: 'Stock', sortable: true, align: 'center' },
    { key: 'profit', label: 'Bénéfice HT', sortable: true, align: 'right' },
  ];

  readonly rows = computed(() => this._products());

  ngOnInit() {
    this.loadData();
  }

  private async loadData() {
    this.loading.set(true);
    this.error.set(null);
    try {
      const [products, orders, details, stocks] = await Promise.all([
        firstValueFrom(this.productService.getAllFull()),
        firstValueFrom(this.orderService.getAllFull()),
        firstValueFrom(this.orderDetailService.getAllFull()),
        firstValueFrom(this.stockService.getAllFull()),
      ]);

      const stateByOrder = new Map(orders.map(o => [o.id, o.current_state]));
      const isCounted = (idOrder: number) => {
        const s = stateByOrder.get(idOrder);
        return s === ORDER_STATE_PAYMENT_ACCEPTED || s === ORDER_STATE_DELIVERED;
      };

      const productStats = new Map<number, { salesHT: number; qtySold: number }>();
      for (const d of details) {
        if (!isCounted(d.id_order)) continue;
        const pid = d.product_id ?? 0;
        const qty = d.product_quantity ?? 0;
        const venteHT = parseFloat(d.total_price_tax_excl || '0') || (parseFloat(d.unit_price_tax_excl || '0') * qty);
        
        const stats = productStats.get(pid) ?? { salesHT: 0, qtySold: 0 };
        stats.salesHT += venteHT;
        stats.qtySold += qty;
        productStats.set(pid, stats);
      }

      const stockByProduct = new Map<number, number>();
      for (const s of stocks) {
        // Simple aggregation by product ID
        stockByProduct.set(s.id_product, (stockByProduct.get(s.id_product) ?? 0) + s.quantity);
      }

      const rows = products.map(p => {
        const stats = productStats.get(p.id) ?? { salesHT: 0, qtySold: 0 };
        const wholesaleHT = parseFloat(p.wholesale_price || '0');
        const costHT = wholesaleHT * stats.qtySold;
        const profitHT = stats.salesHT - costHT;
        
        return {
          name: p.name?.[0]?.value || 'Sans nom',
          reference: p.reference || '-',
          sales: stats.qtySold,
          stock: stockByProduct.get(p.id) ?? 0,
          profit: this.money(profitHT),
          rawProfit: profitHT
        };
      });

      // Show top products by profit
      this._products.set(rows.sort((a, b) => b.rawProfit - a.rawProfit));

    } catch (err: any) {
      this.error.set(err?.message || 'Erreur lors du chargement des données produits');
    } finally {
      this.loading.set(false);
    }
  }

  private money(value: number): string {
    return value.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €';
  }
}
