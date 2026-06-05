import {
  Component,
  OnInit,
  signal,
  computed,
  inject,
  ChangeDetectionStrategy,
} from '@angular/core';
import { ReactiveFormsModule, FormsModule, FormControl } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { AlertComponent } from '@app/shared/components/alert/alert.component';
import { LoaderComponent } from '@app/shared/components/loader/loader.component';
import { BadgeComponent } from '@app/shared/ui/badge/badge.component';
import { ButtonComponent } from '@app/shared/ui/button/button.component';
import { PageHeaderComponent } from '@app/shared/ui/page-header/page-header.component';
import { TableComponent, TableColumn } from '@app/shared/ui/table/table.component';
import { TableCellDirective } from '@app/shared/ui/table/table-cell.directive';
import { ProductService, StockAvailableService, StockMovementService, StockMovementReasonService, CombinationService } from '@app/core/services';
import { StockMvtReason } from '@app/core/constants';
import { psLang, formatDateISO, useLoader } from '@app/core/utils';
import { Product, StockMovementReason, StockAvailable, Combination, StockMovement } from '@app/core/models';

interface StockRow {
  idStock:            number;
  idProduct:          number;
  idProductAttribute: number;
  productName:        string;
  productRef:         string;
  variantLabel:       string;
  quantity:           number;
  qtyControl:         FormControl<number>;
  saving:             boolean;
  saved:              boolean;
  saveError:          string | null;
  isParent?:          boolean;
}

interface MovementRow {
  id:           number;
  idStock:      number;
  idProduct:    number;
  date:         string;
  dateRaw:      string;
  productName:  string;
  productRef:   string;
  variantLabel: string;
  reasonLabel:  string;
  idReason:     number;
  sign:         number;
  quantity:     number;
  qtyDisplay:   string;
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-stock',
  standalone: true,
  imports: [
    ReactiveFormsModule, FormsModule, RouterLink,
    AlertComponent, LoaderComponent,
    BadgeComponent, ButtonComponent,
    PageHeaderComponent, TableComponent, TableCellDirective,
  ],
  templateUrl: './stock.component.html',
  styleUrl: './stock.component.css',
})
export class StockComponent implements OnInit {
  private readonly productService     = inject(ProductService);
  private readonly stockService       = inject(StockAvailableService);
  private readonly movementService    = inject(StockMovementService);
  private readonly stockReasonService = inject(StockMovementReasonService);
  private readonly combinationService = inject(CombinationService);
  private readonly loader = useLoader();

  readonly loading  = this.loader.loading;
  readonly error    = this.loader.error;
  private readonly _rows = signal<StockRow[]>([]);

  /** id_stock_mvt_reason → libellé localisé (depuis l'entité StockMovementReason). */
  private readonly reasonLabels = new Map<number, string>();

  readonly tableColumns: TableColumn[] = [
    { key: 'productName', label: 'Produit',       sortable: true, searchable: true },
    { key: 'productRef',  label: 'Référence',     sortable: true                   },
    { key: 'variantLabel',label: 'Variant'                                          },
    { key: 'quantity',    label: 'Stock actuel',  sortable: true, align: 'center'  },
    { key: '_qtyInput',   label: 'Nouveau stock', align: 'center', width: '110px'  },
    { key: '_reason',     label: 'Raison',        align: 'center', width: '140px'  },
    { key: '_action',     label: '',              align: 'center', width: '130px'  },
  ];

  readonly tableRows = computed(() =>
    this._rows().map(r => ({ ...r } as Record<string, any>)),
  );

  // ── Mouvements de stock ─────────────────────────────────────────────────────
  private readonly _mvtRows = signal<MovementRow[]>([]);
  readonly reasons          = signal<StockMovementReason[]>([]);
  readonly filterSign       = signal<string>('all');
  readonly filterReason     = signal<number>(0);

  readonly mvtColumns: TableColumn[] = [
    { key: 'date',        label: 'Date',       sortable: true                  },
    { key: 'idProduct',   label: 'ID produit', sortable: true, align: 'center' },
    { key: 'productName', label: 'Produit',    sortable: true, searchable: true },
    { key: 'productRef',  label: 'Référence',  sortable: true, searchable: true },
    { key: 'variantLabel',label: 'Variant'                                      },
    { key: 'reasonLabel', label: 'Mouvement',  sortable: true                  },
    { key: '_qty',        label: 'Quantité',   sortable: true, align: 'center' },
  ];

  readonly mvtRows = computed(() => {
    const sign   = this.filterSign();
    const reason = this.filterReason();
    return this._mvtRows()
      .filter(r => sign === 'all' || r.sign === Number(sign))
      .filter(r => reason === 0   || r.idReason === reason)
      .map(r => ({ ...r } as Record<string, any>));
  });

  ngOnInit(): void {
    void this.loader.run(async () => {
      const [stocks, variantLabels, reasons, products, combinations, movements] =
        await Promise.all([
          firstValueFrom(this.stockService.getAllFull()),
          firstValueFrom(this.combinationService.getVariantLabelMap()),
          firstValueFrom(this.stockReasonService.getAllFull()),
          firstValueFrom(this.productService.getAllFull()),
          firstValueFrom(this.combinationService.getAllFull()),
          firstValueFrom(this.movementService.getAllFull()),
        ]);

      this.reasons.set(reasons);

      this.reasonLabels.clear();
      for (const r of reasons) {
        this.reasonLabels.set(r.id, psLang(r.name));
      }

      const reasonMap    = new Map<number, StockMovementReason>(reasons.map(r => [r.id, r]));
      const productById  = new Map<number, Product>(products.map(p => [p.id, p]));
      const hasVariant   = this.stockService.computeHasVariantSet(stocks);

      const stockRows = await this.buildStockRows(stocks, products, combinations, variantLabels, hasVariant);
      this._rows.set(stockRows);

      const mvtRows = await this.buildMovementRows(movements, stocks, products, combinations, variantLabels, reasonMap, productById);
      this._mvtRows.set(mvtRows);
    });
  }

  private async buildStockRows(
    stocks: StockAvailable[],
    products: Product[],
    combinations: Combination[],
    variantLabels: Map<number, string>,
    hasVariant: Set<number>,
  ): Promise<StockRow[]> {
    const productById    = new Map<number, Product>(products.map(p => [p.id, p]));
    const combinationById = new Map(combinations.map(c => [c.id, c]));

    const ensureProduct = async (idProduct: number): Promise<Product | undefined> => {
      if (!idProduct) return undefined;
      const cached = productById.get(idProduct);
      if (cached) return cached;
      try {
        const fetched = await firstValueFrom(this.productService.getById(idProduct));
        productById.set(fetched.id, fetched);
        return fetched;
      } catch {
        return undefined;
      }
    };

    const rows: StockRow[] = [];
    for (const s of stocks) {
      let idProduct = s.id_product || 0;
      if (!idProduct) {
        try {
          const fullStock = await firstValueFrom(this.stockService.getById(s.id));
          idProduct = fullStock.id_product || 0;
        } catch { /* ignore */ }
      }
      const combination = s.id_product_attribute > 0
        ? combinationById.get(s.id_product_attribute)
        : undefined;
      if (!idProduct) idProduct = combination?.id_product || 0;

      const product = await ensureProduct(idProduct);

      rows.push({
        idStock:            s.id,
        idProduct,
        idProductAttribute: s.id_product_attribute,
        productName:  product ? psLang(product.name) : `Produit #${idProduct || s.id}`,
        productRef:   product?.reference || combination?.reference || '',
        variantLabel: s.id_product_attribute > 0
          ? (variantLabels.get(s.id_product_attribute) || `Variant #${s.id_product_attribute}`)
          : 'Principal',
        quantity:   s.quantity,
        qtyControl: new FormControl(s.quantity, { nonNullable: true }),
        saving:     false,
        saved:      false,
        saveError:  null,
        isParent:   s.id_product_attribute === 0 && hasVariant.has(idProduct),
      });
    }

    rows.sort((a, b) =>
      a.productName.localeCompare(b.productName, 'fr') || a.idProductAttribute - b.idProductAttribute,
    );
    return rows;
  }

  private async buildMovementRows(
    movements: StockMovement[],
    stocks: StockAvailable[],
    products: Product[],
    combinations: Combination[],
    variantLabels: Map<number, string>,
    reasonMap: Map<number, StockMovementReason>,
    productById: Map<number, Product>,
  ): Promise<MovementRow[]> {
    const combinationById = new Map(combinations.map(c => [c.id, c]));

    const stockMap = new Map<number, { idProduct: number; idAttr: number }>(
      stocks.map(s => [s.id, { idProduct: s.id_product, idAttr: s.id_product_attribute }]),
    );
    const productByRef = new Map<string, Product>();
    for (const p of products) {
      if (p.reference) productByRef.set(p.reference, p);
    }
    const combinationByRef = new Map<string, number>();
    for (const c of combinations) {
      if (c.reference) combinationByRef.set(c.reference, c.id_product);
    }

    const ensureProduct = async (idProduct: number): Promise<Product | undefined> => {
      if (!idProduct) return undefined;
      const cached = productById.get(idProduct);
      if (cached) return cached;
      try {
        const fetched = await firstValueFrom(this.productService.getById(idProduct));
        productById.set(fetched.id, fetched);
        return fetched;
      } catch {
        return undefined;
      }
    };

    const resolveMvtIds = (m: StockMovement): { idProduct: number; idAttr: number } => {
      const link = stockMap.get(m.id_stock);
      const idAttr = (m.id_product_attribute ?? 0) > 0 ? m.id_product_attribute! : link?.idAttr ?? 0;
      let idProduct = (m.id_product ?? 0) > 0
        ? m.id_product!
        : link?.idProduct || combinationById.get(idAttr)?.id_product || 0;
      if (!idProduct && m.reference) {
        idProduct = productByRef.get(m.reference)?.id ?? combinationByRef.get(m.reference) ?? 0;
      }
      return { idProduct, idAttr };
    };

    const rows: MovementRow[] = [];
    for (const m of movements) {
      const { idProduct, idAttr } = resolveMvtIds(m);
      const product    = await ensureProduct(idProduct);
      const combination = idAttr > 0 ? combinationById.get(idAttr) : undefined;
      const reason     = reasonMap.get(m.id_stock_mvt_reason);
      const qty        = m.physical_quantity;

      rows.push({
        id:           m.id,
        idStock:      m.id_stock,
        idProduct,
        date:         formatDateISO(m.date_add),
        dateRaw:      m.date_add,
        productName:  product
          ? psLang(product.name)
          : (psLang(m.product_name) || (idProduct > 0 ? `Produit #${idProduct}` : '—')),
        productRef:   product?.reference || combination?.reference || m.reference || '',
        variantLabel: idAttr > 0
          ? (variantLabels.get(idAttr) || `Variant #${idAttr}`)
          : 'Principal',
        reasonLabel:  reason ? psLang(reason.name) : `Raison #${m.id_stock_mvt_reason}`,
        idReason:     m.id_stock_mvt_reason,
        sign:         m.sign,
        quantity:     qty,
        qtyDisplay:   m.sign >= 0 ? `+${qty}` : `-${qty}`,
      });
    }

    rows.sort((a, b) => b.dateRaw.localeCompare(a.dateRaw));
    return rows;
  }


  async save(row: StockRow): Promise<void> {
    const newQty = row.qtyControl.value;
    if (row.saving || newQty < 0) return;

    const oldQty = row.quantity;

    // Mark row as saving (optimistic update)
    this._rows.update(rows =>
      rows.map(r => r.idStock === row.idStock
        ? { ...r, saving: true, saved: false, saveError: null, quantity: newQty }
        : r)
    );

    try {
      await this.stockService.adjustQuantity(row.idProduct, row.idProductAttribute, oldQty, newQty);

      this._rows.update(rows =>
        rows.map(r => r.idStock === row.idStock ? { ...r, saving: false, saved: true } : r)
      );

      setTimeout(() => {
        this._rows.update(rows =>
          rows.map(r => r.idStock === row.idStock ? { ...r, saved: false } : r)
        );
      }, 2500);

    } catch (err: unknown) {
      // Revert the optimistic quantity update on failure
      this._rows.update(rows =>
        rows.map(r => r.idStock === row.idStock
          ? { ...r, saving: false, quantity: oldQty, saveError: err instanceof Error ? err.message : 'Erreur lors de la mise à jour' }
          : r)
      );
    }
  }

  /** Id de la raison qui sera appliquée à la sauvegarde, selon le sens de l'écart. */
  private reasonIdFor(row: StockRow): number | null {
    const delta = row.qtyControl.value - row.quantity;
    if (delta > 0) return StockMvtReason.ENTREE_MANUELLE;
    if (delta < 0) return StockMvtReason.SORTIE_MANUELLE;
    return null;
  }

  /** Libellé de la raison de mouvement appliquée à la sauvegarde de cette ligne. */
  reasonLabel(row: StockRow): string {
    const id = this.reasonIdFor(row);
    if (id === null) return 'Aucun changement';
    return this.reasonLabels.get(id)
      ?? (id === StockMvtReason.ENTREE_MANUELLE ? 'Entrée manuelle' : 'Sortie manuelle');
  }

  /** Variante de badge associée à la raison (entrée = succès, sortie = danger). */
  reasonVariant(row: StockRow): 'success' | 'danger' | 'neutral' {
    const id = this.reasonIdFor(row);
    if (id === StockMvtReason.ENTREE_MANUELLE) return 'success';
    if (id === StockMvtReason.SORTIE_MANUELLE) return 'danger';
    return 'neutral';
  }

}
