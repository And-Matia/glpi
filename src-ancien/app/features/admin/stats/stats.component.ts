import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import {
  CategoryService,
  OrderDetailService,
  OrderService,
  ProductService,
  StockAvailableService,
  TaxRuleService,
  TaxService,
  ORDER_STATE_PAYMENT_ACCEPTED,
  ORDER_STATE_DELIVERED,
} from '@app/core';
import { formatCurrency, psLang, useLoader } from '@app/core/utils';
import { LoaderComponent } from '@app/shared/components/loader/loader.component';
import { AlertComponent } from '@app/shared/components/alert/alert.component';
import { PageHeaderComponent } from '@app/shared/ui/page-header/page-header.component';
import { TableComponent, TableColumn } from '@app/shared/ui/table/table.component';
import { CategoryStockStatsComponent } from './components/category-stock-stats/category-stock-stats.component';

interface CategoryStatRow {
  categorie: string;
  ventes: string;
  achats: string;
  benefice: string;
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-stats',
  standalone: true,
  imports: [LoaderComponent, AlertComponent, PageHeaderComponent, TableComponent, CategoryStockStatsComponent],
  templateUrl: './stats.component.html',
  styleUrl: './stats.component.css',
})
export class StatsComponent implements OnInit {
  private readonly orderService = inject(OrderService);
  private readonly orderDetailService = inject(OrderDetailService);
  private readonly productService = inject(ProductService);
  private readonly categoryService = inject(CategoryService);
  private readonly stockService = inject(StockAvailableService);
  private readonly taxRuleService = inject(TaxRuleService);
  private readonly taxService = inject(TaxService);
  private readonly loader = useLoader();

  readonly loading = this.loader.loading;
  readonly error = this.loader.error;

  readonly totalVentes = signal('—');
  readonly totalAchatsHT = signal('—');
  readonly totalAchatsTTC = signal('—');
  readonly totalAchatsAllHT = signal('—');
  readonly totalAchatsAllTTC = signal('—');
  readonly totalBeneficeHT = signal('—');
  readonly totalBeneficeTTC = signal('—');

  readonly statRows = signal<CategoryStatRow[]>([]);

  readonly statColumns: TableColumn[] = [
    { key: 'categorie', label: 'Catégorie', sortable: true },
    { key: 'ventes', label: 'Ventes HT', align: 'center' },
    { key: 'achats', label: 'Achats HT', align: 'center' },
    { key: 'benefice', label: 'Bénéfice', align: 'center' },
  ];

  ngOnInit(): void {
    void this.loader.run(async () => {
      const [orders, details, products, categories, stocks, taxRules, taxes] =
        await Promise.all([
          firstValueFrom(this.orderService.getAllFull()),
          firstValueFrom(this.orderDetailService.getAllFull()),
          firstValueFrom(this.productService.getAllFull()),
          firstValueFrom(this.categoryService.getAllFull()),
          firstValueFrom(this.stockService.getAllFull()),
          firstValueFrom(this.taxRuleService.getAllFull()),
          firstValueFrom(this.taxService.getAllFull()),
        ]);

      // id_tax_rules_group → taux de taxe (%). Pour passer le prix wholesale (HT) en TTC.
      const taxRateById = new Map(taxes.map((t) => [t.id, this.num(t.rate)]));
      const rateByGroup = new Map<number, number>();
      for (const rule of taxRules) {
        if (!rateByGroup.has(rule.id_tax_rules_group)) {
          rateByGroup.set(rule.id_tax_rules_group, taxRateById.get(rule.id_tax) ?? 0);
        }
      }
      const achatTtc = (htUnit: number, idTaxRulesGroup: number | undefined): number =>
        htUnit * (1 + (rateByGroup.get(idTaxRulesGroup ?? 0) ?? 0) / 100);
      const categoriesFiltered = categories.filter((c) => c.id !== 1 && c.id !== 2);
      const stockByProduct = new Map<number, typeof stocks>();
      for (const stock of stocks) {
        const list = stockByProduct.get(stock.id_product) ?? [];
        list.push(stock);
        stockByProduct.set(stock.id_product, list);
      }
      // use service helper to know which products have variants
      const hasVariant = this.stockService.computeHasVariantSet(stocks);
      const stateByOrder = new Map<number, number | null>(
        orders.map((o) => [o.id, o.current_state ?? null]),
      );
      const productById = new Map(products.map((p) => [p.id, p]));

      const isCounted = (idOrder: number): boolean => {
        const s = stateByOrder.get(idOrder);
        return s === ORDER_STATE_PAYMENT_ACCEPTED || s === ORDER_STATE_DELIVERED;
      };

      const byCategory = new Map<
        number,
        { ventes: number; ventesTTC: number; achats: number; achatsHT: number }
      >();
      for (const d of details) {
        if (!isCounted(d.id_order)) continue;
        const productId = d.product_id ?? 0;
        const product = productById.get(productId);
        const catId = product?.id_category_default ?? 0;
        const qty = d.product_quantity ?? 0;

        const venteHT = this.num(d.total_price_tax_excl) || this.num(d.unit_price_tax_excl) * qty;
        const venteTTC = this.num(d.total_price_tax_incl) || this.num(d.unit_price_tax_incl) * qty;
        // Prix wholesale (HT) seul, converti en TTC via le taux de taxe du produit.
        const wholesaleHT =
          this.num(d.original_wholesale_price) || this.num(product?.wholesale_price);
        const achatHT = wholesaleHT * qty;
        const achatTTC = achatTtc(wholesaleHT, product?.id_tax_rules_group) * qty;

        const acc =
          byCategory.get(catId) ?? { ventes: 0, ventesTTC: 0, achats: 0, achatsHT: 0 };
        acc.ventes += venteHT;
        acc.ventesTTC += venteTTC;
        acc.achats += achatTTC;
        acc.achatsHT += achatHT;
        byCategory.set(catId, acc);
      }

      let sumVentes = 0;
      let sumVentesTTC = 0;
      let sumAchats = 0;
      let sumAchatsHT = 0;
      const statRows: CategoryStatRow[] = [];
      for (const cat of categoriesFiltered) {
        const acc = byCategory.get(cat.id);
        if (!acc) continue;
        sumVentes += acc.ventes;
        sumVentesTTC += acc.ventesTTC;
        sumAchats += acc.achats;
        sumAchatsHT += acc.achatsHT;
        statRows.push({
          categorie: psLang(cat.name),
          ventes: formatCurrency(acc.ventes, 2),
          achats: formatCurrency(acc.achatsHT, 2),
          benefice: formatCurrency(acc.ventes - acc.achatsHT, 2),
        });
      }
      statRows.push({
        categorie: 'TOTAL',
        ventes: formatCurrency(sumVentes, 2),
        achats: formatCurrency(sumAchatsHT, 2),
        benefice: formatCurrency(sumVentes - sumAchatsHT, 2),
      });

      this.statRows.set(statRows);

      // Quantités vendues par produit sur les commandes comptées (payées OU
      // livrées). PrestaShop décrémente stock_available.quantity à chaque
      // commande validée : la quantité physique achetée À L'ORIGINE =
      // stock disponible actuel + tout ce qui a été vendu (réservé + livré).
      const soldByProduct = new Map<number, number>();
      for (const d of details) {
        if (!isCounted(d.id_order)) continue;
        const pid = d.product_id ?? 0;
        soldByProduct.set(
          pid,
          (soldByProduct.get(pid) ?? 0) + (d.product_quantity ?? 0),
        );
      }

      // Achats sur tout le stock physique d'origine (pas seulement les produits vendus).
      let sumAchatsAllHT = 0;
      let sumAchatsAllTTC = 0;
      for (const product of products) {
        const productStocks = stockByProduct.get(product.id) ?? [];
        const relevantStocks = hasVariant.has(product.id)
          ? productStocks.filter((s) => s.id_product_attribute !== 0)
          : productStocks.filter((s) => s.id_product_attribute === 0);
        const disponible = relevantStocks.reduce((sum, s) => sum + (s.quantity ?? 0), 0);
        const qty = disponible + (soldByProduct.get(product.id) ?? 0);
        const wholesaleHT = this.num(product.wholesale_price);
        sumAchatsAllHT += wholesaleHT * qty;
        sumAchatsAllTTC += achatTtc(wholesaleHT, product.id_tax_rules_group) * qty;
      }

      this.totalVentes.set(formatCurrency(sumVentes, 2));
      this.totalAchatsHT.set(formatCurrency(sumAchatsHT, 2));
      this.totalAchatsTTC.set(formatCurrency(sumAchats, 2));
      this.totalAchatsAllHT.set(formatCurrency(sumAchatsAllHT, 2));
      this.totalAchatsAllTTC.set(formatCurrency(sumAchatsAllTTC, 2));
      this.totalBeneficeHT.set(formatCurrency(sumVentes - sumAchatsHT, 2));
      this.totalBeneficeTTC.set(formatCurrency(sumVentesTTC - sumAchats, 2));
    });
  }

  private num(value: string | null | undefined): number {
    const n = parseFloat(value ?? '');
    return Number.isFinite(n) ? n : 0;
  }
}
