import { inject, Injectable } from '@angular/core';
import { Observable, of, switchMap, map } from 'rxjs';
import { ProductOptionApi } from '../api/product-option.api';
import { ProductOption, ProductOptionListItem, ProductOptionWritable } from '../models/ps/product-option.model';
import { ProductOptionSerializer } from '../serializers/product-option.serializer';
import { PsBaseService } from './ps-base.service';
import { CacheRegistry } from './cache-registry.service';

@Injectable({ providedIn: 'root' })
export class ProductOptionService extends PsBaseService<
  ProductOption,
  ProductOptionWritable,
  ProductOptionListItem
> {
  protected api = inject(ProductOptionApi);
  protected serializer = inject(ProductOptionSerializer);

  private cache: ProductOption[] | null = null;

  constructor() {
    super();
    inject(CacheRegistry).register(() => (this.cache = null));
  }

  override create(data: ProductOptionWritable): Observable<ProductOption> {
    return super.create(data).pipe(
      map((created) => {
        if (this.cache) this.cache.push(created);
        return created;
      }),
    );
  }

  getOrCreate(name: string): Observable<number> {
    const fetchCache$ = this.cache
      ? of(this.cache)
      : this.getAllFull().pipe(map((full) => (this.cache = full)));

    return fetchCache$.pipe(
      switchMap((cache) => {
        const existing = cache.find((o) =>
          o.name?.some((n) => n.value.toLowerCase() === name.toLowerCase()),
        );
        if (existing) return of(existing.id);

        return this.create({
          group_type: 'select',
          name: [{ id: 1, value: name }],
          public_name: [{ id: 1, value: name }],
        }).pipe(map((created) => created.id));
      }),
    );
  }
}
