import { ChangeDetectionStrategy, Component, output, input } from '@angular/core';

export interface CategoryFilter {
  id: number;
  name: string;
}

export interface Filters {
  search: string;
  categoryId: number | null;
  priceMin: number | null;
  priceMax: number | null;
}

@Component({
  selector: 'app-product-filters',
  standalone: true,
  imports: [],
  templateUrl: './product-filters.component.html',
  styleUrl: './product-filters.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductFiltersComponent {
  categories = input.required<CategoryFilter[]>();
  filters = input.required<Filters>();

  filtersChange = output<Filters>();

  onSearch(e: Event): void {
    const term = (e.target as HTMLInputElement)?.value ?? '';
    this.filtersChange.emit({ ...this.filters(), search: term });
  }

  onCategory(e: Event): void {
    const val = (e.target as HTMLSelectElement)?.value ?? '';
    this.filtersChange.emit({ ...this.filters(), categoryId: val ? Number(val) : null });
  }

  onPriceMin(e: Event): void {
    const val = (e.target as HTMLInputElement)?.value ?? '';
    this.filtersChange.emit({ ...this.filters(), priceMin: val ? Number(val) : null });
  }

  onPriceMax(e: Event): void {
    const val = (e.target as HTMLInputElement)?.value ?? '';
    this.filtersChange.emit({ ...this.filters(), priceMax: val ? Number(val) : null });
  }
}
