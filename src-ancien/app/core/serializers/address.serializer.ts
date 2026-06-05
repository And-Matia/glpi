import { Injectable } from '@angular/core';
import { FieldMapSerializer, FieldDef } from './field-map.serializer';
import { Address, AddressListItem, AddressWritable } from '../models/ps/address.model';
@Injectable({ providedIn: 'root' })
export class AddressSerializer extends FieldMapSerializer<Address, AddressWritable, AddressListItem> {
  protected readonly singularKey = 'address';
  protected readonly pluralKey = 'addresses';

  protected readonly fields: FieldDef[] = [
    { key: 'id', type: 'int', readOnly: true },
    { key: 'id_country', type: 'int' },
    { key: 'alias', type: 'string' },
    { key: 'lastname', type: 'string' },
    { key: 'firstname', type: 'string' },
    { key: 'address1', type: 'string' },
    { key: 'city', type: 'string' },
    { key: 'id_customer', type: 'nullableInt' },
    { key: 'id_manufacturer', type: 'nullableInt' },
    { key: 'id_supplier', type: 'nullableInt' },
    { key: 'id_warehouse', type: 'nullableInt' },
    { key: 'id_state', type: 'nullableInt' },
    { key: 'company', type: 'optionalString' },
    { key: 'vat_number', type: 'optionalString' },
    { key: 'address2', type: 'optionalString' },
    { key: 'postcode', type: 'optionalString' },
    { key: 'other', type: 'optionalString' },
    { key: 'phone', type: 'optionalString' },
    { key: 'phone_mobile', type: 'optionalString' },
    { key: 'dni', type: 'optionalString' },
    { key: 'deleted', type: 'optionalBool' },
    { key: 'date_add', type: 'optionalString' },
    { key: 'date_upd', type: 'optionalString' },
  ];
}
