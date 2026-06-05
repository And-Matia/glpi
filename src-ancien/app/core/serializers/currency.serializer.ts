import { Injectable } from '@angular/core';
import { FieldMapSerializer, FieldDef } from './field-map.serializer';
import { Currency, CurrencyListItem, CurrencyWritable } from '../models/ps/currency.model';

@Injectable({ providedIn: 'root' })
export class CurrencySerializer extends FieldMapSerializer<Currency, CurrencyWritable, CurrencyListItem> {
  protected readonly singularKey = 'currency';
  protected readonly pluralKey = 'currencies';

  protected readonly fields: FieldDef[] = [
    { key: 'id', type: 'int', readOnly: true },
    { key: 'name', type: 'string' },
    { key: 'iso_code', type: 'string' },
    { key: 'numeric_iso_code', type: 'string' },
    { key: 'precision', type: 'int' },
    { key: 'conversion_rate', type: 'string' },
    { key: 'deleted', type: 'bool' },
    { key: 'active', type: 'bool' },
    { key: 'unofficial', type: 'bool' },
    { key: 'modified', type: 'bool' },
    { key: 'names', type: 'lang' },
    { key: 'symbol', type: 'lang' },
    { key: 'pattern', type: 'lang' },
  ];
}
