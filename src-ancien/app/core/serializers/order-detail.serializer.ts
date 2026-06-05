import { Injectable } from '@angular/core';
import { FieldMapSerializer, FieldDef } from './field-map.serializer';
import { OrderDetail, OrderDetailListItem, OrderDetailWritable } from '../models/ps/order-detail.model';
@Injectable({ providedIn: 'root' })
export class OrderDetailSerializer extends FieldMapSerializer<OrderDetail, OrderDetailWritable, OrderDetailListItem> {
  protected readonly singularKey = 'order_detail';
  protected readonly pluralKey = 'order_details';

  protected readonly fields: FieldDef[] = [
    { key: 'id', type: 'int', readOnly: true },
    { key: 'id_order', type: 'int' },
    { key: 'id_warehouse', type: 'int' },
    { key: 'id_shop', type: 'int' },
    { key: 'product_quantity', type: 'int' },
    { key: 'product_quantity_in_stock', type: 'int' },
    { key: 'product_quantity_return', type: 'int' },
    { key: 'product_quantity_refunded', type: 'int' },
    { key: 'product_quantity_reinjected', type: 'int' },
    { key: 'tax_computation_method', type: 'int' },
    { key: 'id_tax_rules_group', type: 'int' },
    { key: 'discount_quantity_applied', type: 'int' },
    { key: 'download_nb', type: 'int' },
    { key: 'id_order_invoice', type: 'nullableInt' },
    { key: 'id_customization', type: 'nullableInt' },
    { key: 'product_id', type: 'nullableInt' },
    { key: 'product_attribute_id', type: 'nullableInt' },
    { key: 'product_name', type: 'string' },
    { key: 'product_ean13', type: 'string' },
    { key: 'product_isbn', type: 'string' },
    { key: 'product_upc', type: 'string' },
    { key: 'product_mpn', type: 'string' },
    { key: 'product_reference', type: 'string' },
    { key: 'product_supplier_reference', type: 'string' },
    { key: 'download_hash', type: 'string' },
    { key: 'download_deadline', type: 'string' },
    { key: 'unit_price_tax_excl', type: 'string' },
    { key: 'unit_price_tax_incl', type: 'string' },
    { key: 'total_price_tax_excl', type: 'string' },
    { key: 'total_price_tax_incl', type: 'string' },
    { key: 'total_shipping_price_tax_excl', type: 'string' },
    { key: 'total_shipping_price_tax_incl', type: 'string' },
    { key: 'purchase_supplier_price', type: 'string' },
    { key: 'original_product_price', type: 'string' },
    { key: 'ecotax', type: 'string' },
    { key: 'ecotax_tax_incl', type: 'string' },
    { key: 'discount_rate', type: 'string' },
  ];

  protected override mapToModel(raw: Record<string, unknown>): OrderDetail {
    const base = super.mapToModel(raw) as OrderDetail;
    return {
      ...base,
      associations: {
        taxes: this.normalizeAssoc<{ id: string }>((raw['associations'] as any)?.taxes, 'tax').map((x) => ({
          id: this.toInt(x.id),
        })),
      },
    };
  }

  protected override mapToXml(data: OrderDetailWritable): object {
    const result = super.mapToXml(data) as Record<string, any>;
    if (data.associations?.taxes?.length) {
      result['associations'] = {
        taxes: { tax: data.associations.taxes.map((x) => ({ id: x.id })) },
      };
    }
    return result;
  }
}

