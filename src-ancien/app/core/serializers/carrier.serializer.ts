import { Injectable } from '@angular/core';
import { FieldMapSerializer, FieldDef } from './field-map.serializer';
import { Carrier, CarrierListItem, CarrierWritable } from '../models/ps/carrier.model';
@Injectable({ providedIn: 'root' })
export class CarrierSerializer extends FieldMapSerializer<Carrier, CarrierWritable, CarrierListItem> {
  protected readonly singularKey = 'carrier';
  protected readonly pluralKey = 'carriers';

  protected readonly fields: FieldDef[] = [
    { key: 'id', type: 'int', readOnly: true },
    { key: 'name', type: 'string' },
    { key: 'active', type: 'bool' },
    { key: 'delay', type: 'lang' },
    { key: 'id_tax_rules_group', type: 'optionalInt' },
    { key: 'id_reference', type: 'optionalInt' },
    { key: 'is_free', type: 'optionalBool' },
    { key: 'url', type: 'optionalString' },
    { key: 'shipping_handling', type: 'optionalBool' },
    { key: 'shipping_external', type: 'optionalBool' },
    { key: 'range_behavior', type: 'optionalBool' },
    { key: 'shipping_method', type: 'optionalInt' },
    { key: 'max_width', type: 'optionalInt' },
    { key: 'max_height', type: 'optionalInt' },
    { key: 'max_depth', type: 'optionalInt' },
    { key: 'max_weight', type: 'optionalString' },
    { key: 'grade', type: 'optionalInt' },
    { key: 'external_module_name', type: 'optionalString' },
    { key: 'need_range', type: 'optionalBool' },
    { key: 'position', type: 'optionalInt' },
    { key: 'deleted', type: 'optionalBool' },
    { key: 'is_module', type: 'optionalBool' },
  ];
}
