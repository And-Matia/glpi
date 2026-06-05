import { Injectable } from '@angular/core';
import { FieldMapSerializer, FieldDef } from './field-map.serializer';
import { Order, OrderListItem, OrderWritable } from '../models/ps/order.model';
@Injectable({ providedIn: 'root' })
export class OrderSerializer extends FieldMapSerializer<Order, OrderWritable, OrderListItem> {
  protected readonly singularKey = 'order';
  protected readonly pluralKey = 'orders';

  protected readonly fields: FieldDef[] = [
    { key: 'id', type: 'int', readOnly: true },
    { key: 'id_address_delivery', type: 'int' },
    { key: 'id_address_invoice', type: 'int' },
    { key: 'id_cart', type: 'int' },
    { key: 'id_currency', type: 'int' },
    { key: 'id_lang', type: 'int' },
    { key: 'id_customer', type: 'int' },
    { key: 'id_carrier', type: 'int' },
    { key: 'module', type: 'string' },
    { key: 'payment', type: 'string' },
    { key: 'total_paid', type: 'stringZero' },
    { key: 'total_paid_real', type: 'stringZero' },
    { key: 'total_products', type: 'stringZero' },
    { key: 'total_products_wt', type: 'stringZero' },
    { key: 'conversion_rate', type: 'string' },
    { key: 'id_shop_group', type: 'nullableInt' },
    { key: 'id_shop', type: 'nullableInt' },
    { key: 'current_state', type: 'nullableInt' },
    { key: 'secure_key', type: 'optionalString' },
    { key: 'reference', type: 'optionalString' },
    { key: 'recyclable', type: 'optionalBool' },
    { key: 'gift', type: 'optionalBool' },
    { key: 'gift_message', type: 'optionalString' },
    { key: 'mobile_theme', type: 'optionalBool' },
    { key: 'total_discounts', type: 'optionalString' },
    { key: 'total_discounts_tax_incl', type: 'optionalString' },
    { key: 'total_discounts_tax_excl', type: 'optionalString' },
    { key: 'total_paid_tax_incl', type: 'optionalString' },
    { key: 'total_paid_tax_excl', type: 'optionalString' },
    { key: 'total_shipping', type: 'optionalString' },
    { key: 'total_shipping_tax_incl', type: 'optionalString' },
    { key: 'total_shipping_tax_excl', type: 'optionalString' },
    { key: 'carrier_tax_rate', type: 'optionalString' },
    { key: 'total_wrapping', type: 'optionalString' },
    { key: 'total_wrapping_tax_incl', type: 'optionalString' },
    { key: 'total_wrapping_tax_excl', type: 'optionalString' },
    { key: 'shipping_number', type: 'optionalString' },
    { key: 'invoice_number', type: 'optionalInt' },
    { key: 'delivery_number', type: 'optionalInt' },
    { key: 'invoice_date', type: 'optionalString' },
    { key: 'delivery_date', type: 'optionalString' },
    { key: 'valid', type: 'optionalBool' },
    { key: 'note', type: 'optionalString' },
    { key: 'round_mode', type: 'optionalInt' },
    { key: 'round_type', type: 'optionalInt' },
    { key: 'date_add', type: 'optionalString' },
    { key: 'date_upd', type: 'optionalString' },
  ];

  protected override mapToModel(o: Record<string, unknown>): Order {
    const base = super.mapToModel(o) as Order;
    const rawRows = this.normalizeAssoc<any>((o['associations'] as any)?.order_rows, 'order_row');
    return {
      ...base,
      associations: rawRows.length ? {
        order_rows: rawRows.map((r: any) => ({
          id: this.toInt(r.id),
          product_id: this.toInt(r.product_id),
          product_attribute_id: this.toInt(r.product_attribute_id),
          product_quantity: this.toInt(r.product_quantity),
          product_name: r.product_name ?? '',
          product_reference: r.product_reference ?? '',
          product_ean13: r.product_ean13 ?? '',
          product_isbn: r.product_isbn ?? '',
          product_upc: r.product_upc ?? '',
          product_price: r.product_price ?? '0',
          id_customization: this.toInt(r.id_customization),
          unit_price_tax_incl: r.unit_price_tax_incl ?? '0',
          unit_price_tax_excl: r.unit_price_tax_excl ?? '0',
        })),
      } : undefined,
    };
  }

  protected override mapToXml(o: OrderWritable): object {
    const r = super.mapToXml(o) as Record<string, any>;
    const rows = o.associations?.order_rows;
    if (rows?.length) {
      r['associations'] = {
        order_rows: {
          order_row: rows.map((row) => ({
            id: row.id,
            product_id: row.product_id,
            product_attribute_id: row.product_attribute_id,
            product_quantity: row.product_quantity,
            product_name: row.product_name,
            product_reference: row.product_reference,
            product_ean13: row.product_ean13,
            product_isbn: row.product_isbn,
            product_upc: row.product_upc,
            product_price: row.product_price,
            id_customization: row.id_customization,
            unit_price_tax_incl: row.unit_price_tax_incl,
            unit_price_tax_excl: row.unit_price_tax_excl,
          })),
        },
      };
    }
    return r;
  }
}

