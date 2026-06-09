import { Component, input, model, computed, ChangeDetectionStrategy } from '@angular/core';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-pagination',
  templateUrl: './pagination.component.html',
  styleUrl: './pagination.component.css',
  standalone: true
})
export class PaginationComponent {
  total    = input.required<number>();
  pageSize = input<number>(10);

  page = model<number>(1);

  readonly totalPages = computed(() => Math.ceil(this.total() / this.pageSize()));

  readonly pages = computed(() => {
    const total   = this.totalPages();
    const current = this.page();
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

    const pages: (number | '…')[] = [1];
    if (current > 3)            pages.push('…');
    for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) pages.push(i);
    if (current < total - 2)    pages.push('…');
    pages.push(total);
    return pages;
  });

  go(p: number | '…'): void {
    if (typeof p !== 'number') return;
    this.page.set(p);
  }

  prev(): void { if (this.page() > 1)                  this.page.update(p => p - 1); }
  next(): void { if (this.page() < this.totalPages())   this.page.update(p => p + 1); }
}
