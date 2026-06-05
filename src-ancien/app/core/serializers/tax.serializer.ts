import { Injectable } from '@angular/core';
import { FieldMapSerializer, FieldDef } from './field-map.serializer';
import { Tax, TaxListItem, TaxWritable } from '../models/ps/tax.model';
@Injectable({ providedIn: 'root' })
export class TaxSerializer extends FieldMapSerializer<Tax, TaxWritable, TaxListItem> {
  protected readonly singularKey = 'tax';
  protected readonly pluralKey = 'taxes';

  protected readonly fields: FieldDef[] = [
    { key: 'id', type: 'int', readOnly: true },
    { key: 'rate', type: 'string' },
    { key: 'name', type: 'lang' },
    { key: 'active', type: 'optionalBool' },
    { key: 'deleted', type: 'optionalBool' },
  ];
}
