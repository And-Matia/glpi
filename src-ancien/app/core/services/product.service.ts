import { inject, Injectable } from '@angular/core';
import { Observable, forkJoin, switchMap, of, map } from 'rxjs';
import { ProductApi } from '../api/product.api';
import { Product, ProductListItem, ProductWritable } from '../models/ps/product.model';
import { ProductSerializer } from '../serializers/product.serializer';
import { PsBaseService } from './ps-base.service';
import { CacheRegistry } from './cache-registry.service';

@Injectable({ providedIn: 'root' })
export class ProductService extends PsBaseService<Product, ProductWritable, ProductListItem> {
  protected api = inject(ProductApi);
  protected serializer = inject(ProductSerializer);

  private cache: Product[] | null = null;

  constructor() {
    super();
    inject(CacheRegistry).register(() => (this.cache = null));
  }

  search(query: string): Observable<Product[]> {
    return this.getAll({ 'filter[name]': `%[${query}]%` }).pipe(
      switchMap((items) =>
        items.length === 0 ? of([]) : forkJoin(items.map((item) => this.getById(item.id))),
      ),
    );
  }

  findByReference(reference: string): Observable<number> {
    const fetchCache$ = this.cache
      ? of(this.cache)
      : this.getAllFull().pipe(map(full => (this.cache = full)));

    return fetchCache$.pipe(
      map(cache => {
        const existing = cache.find(p => p.reference === reference);
        if (!existing) throw new Error(`Produit introuvable : référence "${reference}"`);
        return existing.id;
      })
    );
  }

  findById(id: number): Observable<Product> {
    const fetchCache$ = this.cache
      ? of(this.cache)
      : this.getAllFull().pipe(map(full => (this.cache = full)));

    return fetchCache$.pipe(
      map(cache => {
        const existing = cache.find(p => p.id === id);
        if (!existing) throw new Error(`Produit introuvable : id "${id}"`);
        return existing;
      })
    );
  }

  override create(data: ProductWritable): Observable<Product> {
    return super.create(data).pipe(
      switchMap((created) => {
        if (this.cache) this.cache.push(created);
        return of(created);
      })
    );
  }

  override update(id: string | number, data: ProductWritable): Observable<Product> {
    return super.update(id, data).pipe(
      switchMap((updated) => {
        if (this.cache) {
          const index = this.cache.findIndex(p => p.id === Number(id));
          if (index !== -1) this.cache[index] = updated;
        }
        return of(updated);
      })
    );
  }
}
