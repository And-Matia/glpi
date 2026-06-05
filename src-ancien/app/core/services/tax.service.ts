import { inject, Injectable } from '@angular/core';
import { Observable, of, switchMap, map } from 'rxjs';
import { TaxApi } from '../api/tax.api';
import { Tax, TaxListItem, TaxWritable } from '../models/ps/tax.model';
import { TaxSerializer } from '../serializers/tax.serializer';
import { PsBaseService } from './ps-base.service';
import { CacheRegistry } from './cache-registry.service';

@Injectable({ providedIn: 'root' })
export class TaxService extends PsBaseService<Tax, TaxWritable, TaxListItem> {
  protected api = inject(TaxApi);
  protected serializer = inject(TaxSerializer);

  private cache: Tax[] | null = null;

  constructor() {
    super();
    inject(CacheRegistry).register(() => (this.cache = null));
  }

  override create(data: TaxWritable): Observable<Tax> {
    return super.create(data).pipe(
      switchMap((created) => {
        if (this.cache) this.cache.push(created);
        return of(created);
      })
    );
  }

  findById(id: number): Observable<Tax | undefined> {
    const fetchCache$ = this.cache
      ? of(this.cache)
      : this.getAllFull().pipe(map(full => (this.cache = full)));

    return fetchCache$.pipe(
      map(cache => cache.find(t => t.id === id))
    );
  }
}
