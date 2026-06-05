import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { TableComponent, TableColumn } from '@app/shared/ui/table/table.component';
import { TableCellDirective } from '@app/shared/ui/table/table-cell.directive';

export interface RemovalSummaryRow {
  productName: string;
  variantLabel: string;
  reference: string;
  categoryName: string;
  amountRequested: number;
  amountRemoved: number;
}

export interface AddingSummaryRow {
  productName: string;
  variantLabel: string;
  reference: string;
  categoryName: string;
  amountRequested: number;
  amountAdded: number;
}

@Component({
  selector: 'app-stock-removal-summary',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TableComponent, TableCellDirective],
  templateUrl: './stock-removal-summary.component.html',
  styleUrl: './stock-removal-summary.component.css',
})
export class StockRemovalSummaryComponent {
  readonly rowsToRemove = input.required<RemovalSummaryRow[]>();
  readonly rowsToAdd = input.required<AddingSummaryRow[]>();

  readonly columnsToRemove: TableColumn[] = [
    { key: 'productName', label: 'Produit', sortable: true, searchable: true },
    { key: 'variantLabel', label: 'Variant', sortable: true },
    { key: 'reference', label: 'Référence', sortable: true, searchable: true },
    { key: 'categoryName', label: 'Catégorie', sortable: true, searchable: true },
    { key: 'amountRequested', label: 'Stock théorique à retirer', sortable: true, align: 'center' },
    { key: 'amountRemoved', label: 'Stock retiré réel', sortable: true, align: 'center' },
  ];

  readonly columnsToAdd: TableColumn[] = [
    { key: 'productName', label: 'Produit', sortable: true, searchable: true },
    { key: 'variantLabel', label: 'Variant', sortable: true },
    { key: 'reference', label: 'Référence', sortable: true, searchable: true },
    { key: 'categoryName', label: 'Catégorie', sortable: true, searchable: true },
    { key: 'amountRequested', label: 'Stock théorique à ajouter', sortable: true, align: 'center' },
    { key: 'amountAdded', label: 'Stock ajouter reel', sortable: true, align: 'center' },
  ];

  readonly tableRowsToRemove = computed(() =>
    this.rowsToRemove().map((r) => ({ ...r }) as Record<string, any>),
  );

  readonly totalRequestedToRemove = computed(() =>
    this.rowsToRemove().reduce((sum, r) => sum + r.amountRequested, 0),
  );

  readonly tableRowsToAdd = computed(() =>
    this.rowsToAdd().map((r) => ({ ...r }) as Record<string, any>),
  );

  readonly totalRequestedToAdd = computed(() =>
    this.rowsToAdd().reduce((sum, r) => sum + r.amountRequested, 0),
  );

  readonly totalRemoved = computed(() =>
    this.rowsToRemove().reduce((sum, r) => sum + r.amountRemoved, 0),
  );

  readonly totalAdded = computed(() =>
    this.rowsToAdd().reduce((sum, r) => sum + r.amountAdded, 0),
  );
}
