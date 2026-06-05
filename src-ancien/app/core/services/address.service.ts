import { inject, Injectable } from '@angular/core';
import { Observable, of, switchMap, map } from 'rxjs';
import { AddressApi } from '../api/address.api';
import { Address, AddressListItem, AddressWritable } from '../models/ps/address.model';
import { AddressSerializer } from '../serializers/address.serializer';
import { splitName } from '../utils/string-utils';
import { PsBaseService } from './ps-base.service';
import { CacheRegistry } from './cache-registry.service';
import { DEFAULT_COUNTRY } from '../constants';

@Injectable({ providedIn: 'root' })
export class AddressService extends PsBaseService<Address, AddressWritable, AddressListItem> {
  protected api        = inject(AddressApi);
  protected serializer = inject(AddressSerializer);

  private cache: Address[] | null = null;

  constructor() {
    super();
    inject(CacheRegistry).register(() => (this.cache = null));
  }

  override create(data: AddressWritable): Observable<Address> {
    return super.create({ postcode: '000000', ...data }).pipe(
      switchMap((created) => {
        if (this.cache) this.cache.push(created);
        return of(created);
      })
    );
  }

  getOrCreate(idCustomer: number, address1: string, nom: string): Observable<number> {
    const fetchCache$ = this.cache
      ? of(this.cache)
      : this.getAllFull().pipe(map(full => (this.cache = full)));

    return fetchCache$.pipe(
      switchMap(cache => {
        const existing = cache.find(a =>
          a.id_customer === idCustomer &&
          a.address1.toLowerCase() === address1.toLowerCase()
        );
        if (existing) return of(existing.id);

        const { lastname, firstname } = splitName(nom);
        return this.create({
          id_customer: idCustomer,
          id_country: DEFAULT_COUNTRY,
          alias: address1,
          lastname,
          firstname,
          address1: address1 || 'N/A',
          city: address1,
          postcode: '00000',
        }).pipe(map(created => created.id));
      })
    );
  }
}
