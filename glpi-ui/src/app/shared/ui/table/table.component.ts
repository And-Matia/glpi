import {
  Component,
  contentChildren,
  input,
  signal,
  computed,
  ChangeDetectionStrategy,
  TemplateRef,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { TableCellDirective } from './table-cell.directive';

export interface TableColumn {
  key:         string;
  label:       string;
  sortable?:   boolean;
  searchable?: boolean;
  align?:      'left' | 'center' | 'right';
  width?:      string;
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-table',
  templateUrl: './table.component.html',
  styleUrl: './table.component.css',
  imports: [NgTemplateOutlet],
})
export class TableComponent {
  columns     = input.required<TableColumn[]>();
  rows        = input.required<Record<string, any>[]>();
  searchKeys  = input<string[]>([]);
  showToolbar = input<boolean>(true);
  emptyIcon   = input<string>('fa-solid fa-inbox');
  emptyLabel  = input<string>('Aucun résultat');

  readonly searchTerm    = signal('');
  readonly columnFilters = signal<Record<string, string>>({});
  readonly sortKey       = signal<string | null>(null);
  readonly sortDir       = signal<'asc' | 'desc'>('asc');

  private readonly customCells = contentChildren(TableCellDirective);

  readonly filteredRows = computed(() => {
    const term       = this.searchTerm().toLowerCase().trim();
    const colFilters = this.columnFilters();
    const key        = this.sortKey();
    const dir        = this.sortDir();
    const keys       = this.searchKeys().length ? this.searchKeys() : this.columns().map(c => c.key);

    let result = this.rows();

    if (term) {
      result = result.filter(row =>
        keys.some(k => String(row[k] ?? '').toLowerCase().includes(term)),
      );
    }

    const filterKeys = Object.keys(colFilters).filter(k => colFilters[k].trim() !== '');
    if (filterKeys.length) {
      result = result.filter(row =>
        filterKeys.every(fk =>
          String(row[fk] ?? '').toLowerCase().includes(colFilters[fk].toLowerCase().trim()),
        ),
      );
    }

    if (key) {
      result = [...result].sort((a, b) => {
        const cmp = String(a[key] ?? '').localeCompare(String(b[key] ?? ''), undefined, {
          numeric: true, sensitivity: 'base',
        });
        return dir === 'asc' ? cmp : -cmp;
      });
    }

    return result;
  });

  cellTemplate(colKey: string): TemplateRef<any> | null {
    return this.customCells().find(c => c.key() === colKey)?.template ?? null;
  }

  sort(col: TableColumn): void {
    if (!col.sortable) return;
    if (this.sortKey() === col.key) {
      this.sortDir.update(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortKey.set(col.key);
      this.sortDir.set('asc');
    }
  }

  onSearch(event: Event): void {
    this.searchTerm.set((event.target as HTMLInputElement).value);
  }

  onColumnSearch(event: Event, colKey: string): void {
    const value = (event.target as HTMLInputElement).value;
    this.columnFilters.update(filters => ({ ...filters, [colKey]: value }));
  }
}
