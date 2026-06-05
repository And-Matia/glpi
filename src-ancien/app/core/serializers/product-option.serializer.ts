import { Injectable } from '@angular/core';
import { FieldMapSerializer, FieldDef } from './field-map.serializer';
import { ProductOption, ProductOptionListItem, ProductOptionWritable } from '../models/ps/product-option.model';
@Injectable({ providedIn: 'root' })
export class ProductOptionSerializer extends FieldMapSerializer<ProductOption, ProductOptionWritable, ProductOptionListItem> {
  protected readonly singularKey = 'product_option';
  protected readonly pluralKey = 'product_options';

  protected readonly fields: FieldDef[] = [
    { key: 'id', type: 'int', readOnly: true },
    { key: 'group_type', type: 'optionalString' },
    { key: 'name', type: 'lang' },
    { key: 'public_name', type: 'lang' },
    { key: 'is_color_group', type: 'optionalBool' },
    { key: 'position', type: 'optionalInt' },
  ];

  protected override mapToModel(raw: Record<string, unknown>): ProductOption {
    const base = super.mapToModel(raw) as ProductOption;
    return {
      ...base,
      associations: {
        product_option_values: this.normalizeAssoc<{ id: string }>((raw['associations'] as any)?.product_option_values, 'product_option_value').map((x) => ({
          id: this.toInt(x.id),
        })),
      },
    };
  }

  protected override mapToXml(data: ProductOptionWritable): object {
    const result = super.mapToXml(data) as Record<string, any>;
    if (data.associations?.product_option_values?.length) {
      result['associations'] = {
        product_option_values: {
          product_option_value: data.associations.product_option_values.map((x) => ({ id: x.id })),
        },
      };
    }
    return result;
  }
}

