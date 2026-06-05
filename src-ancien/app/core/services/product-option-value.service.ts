import { inject, Injectable } from '@angular/core';
import { Observable, of, switchMap, map } from 'rxjs';
import { ProductOptionValueApi } from '../api/product-option-value.api';
import { ProductOptionValue, ProductOptionValueListItem, ProductOptionValueWritable } from '../models/ps/product-option-value.model';
import { ProductOptionValueSerializer } from '../serializers/product-option-value.serializer';
import { PsBaseService } from './ps-base.service';
import { CacheRegistry } from './cache-registry.service';

@Injectable({ providedIn: 'root' })
export class ProductOptionValueService extends PsBaseService<ProductOptionValue, ProductOptionValueWritable, ProductOptionValueListItem> {
  protected api = inject(ProductOptionValueApi);
  protected serializer = inject(ProductOptionValueSerializer);

  private cache: ProductOptionValue[] | null = null;

  constructor() {
    super();
    inject(CacheRegistry).register(() => (this.cache = null));
  }

  override create(data: ProductOptionValueWritable): Observable<ProductOptionValue> {
    return super.create(data).pipe(
      switchMap((created) => {
        if (this.cache) this.cache.push(created);
        return of(created);
      })
    );
  }

  getOrCreate(name: string, idOption: number): Observable<number> {
    const fetchCache$ = this.cache
      ? of(this.cache)
      : this.getAllFull().pipe(map(full => (this.cache = full)));

    return fetchCache$.pipe(
      switchMap(cache => {
        const existing = cache.find(o =>
          o.id_attribute_group === idOption &&
          o.name?.some(n => n.value.toLowerCase() === name.toLowerCase())
        );
        if (existing) return of(existing.id);

        return this.create({ id_attribute_group: idOption, name: [{ id: 1, value: name }] }).pipe(
          map(created => created.id)
        );
      })
    );
  }

  findByName(name: string): Observable<ProductOptionValue[]> {
    const fetchCache$ = this.cache
      ? of(this.cache)
      : this.getAllFull().pipe(map(full => (this.cache = full)));

    return fetchCache$.pipe(
      map(cache => cache.filter(o =>
        o.name?.some(n => n.value.toLowerCase() === name.toLowerCase())
      ))
    );
  }
}
