import { inject, Injectable } from '@angular/core';
import { Observable, of, switchMap, map } from 'rxjs';
import { CategoryApi } from '../api/category.api';
import { Category, CategoryListItem, CategoryWritable } from '../models/ps/category.model';
import { CategorySerializer } from '../serializers/category.serializer';
import { slugify } from '../utils/string-utils';
import { PsBaseService } from './ps-base.service';
import { CacheRegistry } from './cache-registry.service';

@Injectable({ providedIn: 'root' })
export class CategoryService extends PsBaseService<Category, CategoryWritable, CategoryListItem> {
  protected api = inject(CategoryApi);
  protected serializer = inject(CategorySerializer);

  private cache: Category[] | null = null;

  constructor() {
    super();
    inject(CacheRegistry).register(() => (this.cache = null));
  }

  override create(data: CategoryWritable): Observable<Category> {
    return super.create({ id_parent: 2, ...data }).pipe(
      switchMap((created) => {
        if (this.cache) this.cache.push(created);
        return of(created);
      })
    );
  }

  getOrCreate(name: string): Observable<number> {
    const fetchCache$ = this.cache
      ? of(this.cache)
      : this.getAllFull().pipe(map(full => (this.cache = full)));

    return fetchCache$.pipe(
      switchMap(cache => {
        const existing = cache.find(c =>
          c.name?.some(n => n.value.toLowerCase() === name.toLowerCase())
        );
        if (existing) return of(existing.id);

        return this.create({
          active: true,
          name: [{ id: 1, value: name }],
          link_rewrite: [{ id: 1, value: slugify(name) }],
        }).pipe(map(created => created.id));
      })
    );
  }
}
