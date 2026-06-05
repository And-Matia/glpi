import { inject, Injectable, signal, computed } from '@angular/core';
import { ExampleHttp, Example } from '@app/core/http/example.http';

/**
 * Business logic + shared state for this resource.
 * Components inject this — never the http layer directly.
 */
@Injectable({ providedIn: 'root' })
export class ExampleService {
  private readonly http = inject(ExampleHttp);

  readonly items    = signal<Example[]>([]);
  readonly loading  = signal(false);
  readonly error    = signal<string | null>(null);

  readonly total = computed(() => this.items().length);

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.http.getAll().subscribe({
      next:  items => { this.items.set(items); this.loading.set(false); },
      error: err   => { this.error.set(err.message); this.loading.set(false); },
    });
  }

  create(payload: Omit<Example, 'id'>): void {
    this.http.create(payload).subscribe({
      next: item => this.items.update(list => [...list, item]),
    });
  }

  delete(id: number): void {
    this.http.delete(id).subscribe({
      next: () => this.items.update(list => list.filter(i => i.id !== id)),
    });
  }
}
