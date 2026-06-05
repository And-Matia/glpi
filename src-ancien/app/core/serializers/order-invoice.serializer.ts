import { Injectable } from '@angular/core';
import { FieldMapSerializer, FieldDef } from './field-map.serializer';
import { OrderInvoice, OrderInvoiceListItem, OrderInvoiceWritable } from '../models/ps/order-invoice.model';
@Injectable({ providedIn: 'root' })
export class OrderInvoiceSerializer extends FieldMapSerializer<OrderInvoice, OrderInvoiceWritable, OrderInvoiceListItem> {
  protected readonly singularKey = 'order_invoice';
  protected readonly pluralKey = 'order_invoices';

  protected readonly fields: FieldDef[] = [
    { key: 'id', type: 'int', readOnly: true },
    { key: 'id_order', type: 'int' },
    { key: 'number', type: 'int' },
    { key: 'delivery_number', type: 'int' },
    { key: 'delivery_date', type: 'string' },
    { key: 'total_discount_tax_excl', type: 'stringZero' },
    { key: 'total_discount_tax_incl', type: 'stringZero' },
    { key: 'total_paid_tax_excl', type: 'stringZero' },
    { key: 'total_paid_tax_incl', type: 'stringZero' },
    { key: 'total_products', type: 'stringZero' },
    { key: 'total_products_wt', type: 'stringZero' },
    { key: 'total_shipping_tax_excl', type: 'stringZero' },
    { key: 'total_shipping_tax_incl', type: 'stringZero' },
    { key: 'shipping_tax_computation_method', type: 'string' },
    { key: 'total_wrapping_tax_excl', type: 'stringZero' },
    { key: 'total_wrapping_tax_incl', type: 'stringZero' },
    { key: 'shop_address', type: 'string' },
    { key: 'note', type: 'string' },
    { key: 'date_add', type: 'string' },
  ];
}
