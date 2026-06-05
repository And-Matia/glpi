import { Injectable } from '@angular/core';
import { FieldMapSerializer, FieldDef } from './field-map.serializer';
import { OrderSlip, OrderSlipListItem, OrderSlipWritable } from '../models/ps/order-slip.model';
@Injectable({ providedIn: 'root' })
export class OrderSlipSerializer extends FieldMapSerializer<OrderSlip, OrderSlipWritable, OrderSlipListItem> {
  protected readonly singularKey = 'order_slip';
  protected readonly pluralKey = 'order_slips';

  protected readonly fields: FieldDef[] = [
    { key: 'id', type: 'int', readOnly: true },
    { key: 'id_customer', type: 'int' },
    { key: 'id_order', type: 'int' },
    { key: 'order_slip_type', type: 'int' },
    { key: 'conversion_rate', type: 'string' },
    { key: 'total_products_tax_excl', type: 'string' },
    { key: 'total_products_tax_incl', type: 'string' },
    { key: 'total_shipping_tax_excl', type: 'string' },
    { key: 'total_shipping_tax_incl', type: 'string' },
    { key: 'total_amount', type: 'string' },
    { key: 'total_tax', type: 'string' },
    { key: 'partial', type: 'string' },
    { key: 'date_add', type: 'string' },
    { key: 'date_upd', type: 'string' },
  ];

  protected override mapToModel(raw: Record<string, unknown>): OrderSlip {
    const base = super.mapToModel(raw) as OrderSlip;
    const rawDetails = this.normalizeAssoc<any>((raw['associations'] as any)?.order_slip_details, 'order_slip_detail');
    return {
      ...base,
      associations: rawDetails.length ? {
        order_slip_details: rawDetails.map((d: any) => ({
          id: this.toInt(d.id),
          id_order_detail: this.toInt(d.id_order_detail),
          product_quantity: this.toInt(d.product_quantity),
          amount_tax_excl: d.amount_tax_excl,
          amount_tax_incl: d.amount_tax_incl,
        })),
      } : undefined,
    };
  }

  protected override mapToXml(data: OrderSlipWritable): object {
    const result = super.mapToXml(data) as Record<string, any>;
    const details = data.associations?.order_slip_details;
    if (details?.length) {
      result['associations'] = {
        order_slip_details: {
          order_slip_detail: details.map((d) => ({
            id: d.id,
            id_order_detail: d.id_order_detail,
            product_quantity: d.product_quantity,
            amount_tax_excl: d.amount_tax_excl,
            amount_tax_incl: d.amount_tax_incl,
          })),
        },
      };
    }
    return result;
  }
}

