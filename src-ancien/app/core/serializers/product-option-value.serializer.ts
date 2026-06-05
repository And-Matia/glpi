import { Injectable } from '@angular/core';
import { FieldMapSerializer, FieldDef } from './field-map.serializer';
import { ProductOptionValue, ProductOptionValueListItem, ProductOptionValueWritable } from '../models/ps/product-option-value.model';
@Injectable({ providedIn: 'root' })
export class ProductOptionValueSerializer extends FieldMapSerializer<ProductOptionValue, ProductOptionValueWritable, ProductOptionValueListItem> {
  protected readonly singularKey = 'product_option_value';
  protected readonly pluralKey = 'product_option_values';

  protected readonly fields: FieldDef[] = [
    { key: 'id', type: 'int', readOnly: true },
    { key: 'id_attribute_group', type: 'int' },
    { key: 'name', type: 'lang' },
    { key: 'color', type: 'optionalString' },
    { key: 'position', type: 'optionalInt' },
  ];
}
