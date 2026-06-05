import { inject, Injectable } from '@angular/core';
import { Observable, of, switchMap, map } from 'rxjs';
import { CustomerApi } from '../api/customer.api';
import { Customer, CustomerListItem, CustomerWritable } from '../models/ps/customer.model';
import { CustomerSerializer } from '../serializers/customer.serializer';
import { splitName } from '../utils/string-utils';
import { PsBaseService } from './ps-base.service';
import { CacheRegistry } from './cache-registry.service';
import { DEFAULT_LANG, DEFAULT_GROUP } from '../constants/import.constants';
@Injectable({ providedIn: 'root' })
export class CustomerService extends PsBaseService<Customer, CustomerWritable, CustomerListItem> {
  protected api        = inject(CustomerApi);
  protected serializer = inject(CustomerSerializer);

  private cache: Customer[] | null = null;

  constructor() {
    super();
    inject(CacheRegistry).register(() => (this.cache = null));
  }

  override create(data: CustomerWritable): Observable<Customer> {
    return super.create(data).pipe(
      switchMap((created) => {
        if (this.cache) this.cache.push(created);
        return of(created);
      })
    );
  }

  getOrCreate(email: string, nom: string, passwd: string): Observable<number> {
    const fetchCache$ = this.cache
      ? of(this.cache)
      : this.getAllFull().pipe(map(full => (this.cache = full)));

    return fetchCache$.pipe(
      switchMap(cache => {
        const existing = cache.find(c => c.email.toLowerCase() === email.toLowerCase());
        if (existing) return of(existing.id);

        const { lastname, firstname } = splitName(nom);
        return this.create({
          lastname,
          firstname,
          email,
          passwd,
          active:            true,
          id_lang:           DEFAULT_LANG,
          id_default_group:  DEFAULT_GROUP,
        }).pipe(map(created => created.id));
      })
    );
  }
}
