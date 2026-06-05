import { Injectable } from '@angular/core';
import { FieldMapSerializer, FieldDef } from './field-map.serializer';
import { Cart, CartListItem, CartWritable } from '../models/ps/cart.model';
@Injectable({ providedIn: 'root' })
export class CartSerializer extends FieldMapSerializer<Cart, CartWritable, CartListItem> {
  protected readonly singularKey = 'cart';
  protected readonly pluralKey = 'carts';

  protected readonly fields: FieldDef[] = [
    { key: 'id', type: 'int', readOnly: true },
    { key: 'id_currency', type: 'int' },
    { key: 'id_lang', type: 'int' },
    { key: 'id_address_delivery', type: 'nullableInt' },
    { key: 'id_address_invoice', type: 'nullableInt' },
    { key: 'id_customer', type: 'nullableInt' },
    { key: 'id_guest', type: 'nullableInt' },
    { key: 'id_shop_group', type: 'nullableInt' },
    { key: 'id_shop', type: 'nullableInt' },
    { key: 'id_carrier', type: 'nullableInt' },
    { key: 'recyclable', type: 'optionalBool' },
    { key: 'gift', type: 'optionalBool' },
    { key: 'gift_message', type: 'optionalString' },
    { key: 'mobile_theme', type: 'optionalBool' },
    { key: 'delivery_option', type: 'optionalString' },
    { key: 'secure_key', type: 'optionalString' },
    { key: 'allow_seperated_package', type: 'optionalBool' },
    { key: 'date_add', type: 'optionalString' },
    { key: 'date_upd', type: 'optionalString' },
  ];

  protected override mapToModel(c: Record<string, unknown>): Cart {
    const base = super.mapToModel(c) as Cart;
    const rawRows = this.normalizeAssoc<any>((c['associations'] as any)?.cart_rows, 'cart_row');
    return {
      ...base,
      associations: rawRows.length ? {
        cart_rows: rawRows.map((r: any) => ({
          id_product: this.toInt(r.id_product),
          id_product_attribute: this.toInt(r.id_product_attribute),
          id_address_delivery: this.toInt(r.id_address_delivery),
          id_customization: this.toInt(r.id_customization),
          quantity: this.toInt(r.quantity),
        })),
      } : undefined,
    };
  }

  protected override mapToXml(c: CartWritable): object {
    const r = super.mapToXml(c) as Record<string, any>;
    const rows = c.associations?.cart_rows;
    if (rows?.length) {
      r['associations'] = {
        cart_rows: {
          cart_row: rows.map((row) => ({
            id_product: row.id_product,
            id_product_attribute: row.id_product_attribute,
            id_address_delivery: row.id_address_delivery,
            id_customization: row.id_customization,
            quantity: row.quantity,
          })),
        },
      };
    }
    return r;
  }
}
