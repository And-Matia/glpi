import { Injectable } from '@angular/core';
import { FieldMapSerializer, FieldDef } from './field-map.serializer';
import { Combination, CombinationListItem, CombinationWritable } from '../models/ps/combination.model';
import { formatDate } from '@app/core/utils/date-utils';

@Injectable({ providedIn: 'root' })
export class CombinationSerializer extends FieldMapSerializer<Combination, CombinationWritable, CombinationListItem> {
  protected readonly singularKey = 'combination';
  protected readonly pluralKey = 'combinations';

  protected readonly fields: FieldDef[] = [
    { key: 'id', type: 'int', readOnly: true },
    { key: 'id_product', type: 'int' },
    { key: 'minimal_quantity', type: 'int' },
    { key: 'location', type: 'optionalString' },
    { key: 'ean13', type: 'optionalString' },
    { key: 'isbn', type: 'optionalString' },
    { key: 'upc', type: 'optionalString' },
    { key: 'mpn', type: 'optionalString' },
    { key: 'reference', type: 'optionalString' },
    { key: 'supplier_reference', type: 'optionalString' },
    { key: 'wholesale_price', type: 'optionalString' },
    { key: 'price', type: 'optionalString' },
    { key: 'ecotax', type: 'optionalString' },
    { key: 'weight', type: 'optionalString' },
    { key: 'unit_price_impact', type: 'optionalString' },
    { key: 'available_date', type: 'optionalString' },
    { key: 'quantity', type: 'optionalInt' },
    { key: 'low_stock_threshold', type: 'optionalInt' },
    { key: 'low_stock_alert', type: 'optionalBool' },
    { key: 'default_on', type: 'optionalBool' },
  ];

  protected override mapToModel(c: Record<string, unknown>): Combination {
    const base = super.mapToModel(c) as Combination;
    return {
      ...base,
      associations: {
        product_option_values: this.normalizeAssoc<{ id: string }>((c['associations'] as any)?.product_option_values, 'product_option_value').map((x) => ({
          id: this.toInt(x.id),
        })),
        images: this.normalizeAssoc<{ id: string }>((c['associations'] as any)?.images, 'image').map((x) => ({
          id: this.toInt(x.id),
        })),
      },
    };
  }

  protected override mapToXml(c: CombinationWritable): object {
    const r = super.mapToXml(c) as Record<string, any>;

    // Custom date formatting
    if (c.available_date !== undefined) {
      r['available_date'] = c.available_date ? formatDate(new Date(c.available_date)) : '';
    }

    // Associations
    if (c.associations) {
      r['associations'] = {};
      if (c.associations.product_option_values !== undefined) {
        (r['associations'] as any).product_option_values = {
          product_option_value: c.associations.product_option_values.map((x) => ({ id: x.id })),
        };
      }
      if (c.associations.images !== undefined) {
        (r['associations'] as any).images = {
          image: c.associations.images.map((x) => ({ id: x.id })),
        };
      }
    }

    return r;
  }
}

