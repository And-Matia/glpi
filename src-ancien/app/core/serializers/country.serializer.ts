import { Injectable } from '@angular/core';
import { FieldMapSerializer, FieldDef } from './field-map.serializer';
import { Country, CountryListItem, CountryWritable } from '../models/ps/country.model';
@Injectable({ providedIn: 'root' })
export class CountrySerializer extends FieldMapSerializer<Country, CountryWritable, CountryListItem> {
  protected readonly singularKey = 'country';
  protected readonly pluralKey = 'countries';

  protected readonly fields: FieldDef[] = [
    { key: 'id', type: 'int', readOnly: true },
    { key: 'id_zone', type: 'int' },
    { key: 'call_prefix', type: 'int' },
    { key: 'id_currency', type: 'nullableInt' },
    { key: 'iso_code', type: 'string' },
    { key: 'zip_code_format', type: 'string' },
    { key: 'active', type: 'bool' },
    { key: 'contains_states', type: 'bool' },
    { key: 'need_identification_number', type: 'bool' },
    { key: 'need_zip_code', type: 'bool' },
    { key: 'display_tax_label', type: 'bool' },
    { key: 'name', type: 'lang' },
  ];
}
