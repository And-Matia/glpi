import { Injectable } from '@angular/core';
import { FieldMapSerializer, FieldDef } from './field-map.serializer';
import { OrderPayment, OrderPaymentListItem, OrderPaymentWritable } from '../models/ps/order-payment.model';
@Injectable({ providedIn: 'root' })
export class OrderPaymentSerializer extends FieldMapSerializer<OrderPayment, OrderPaymentWritable, OrderPaymentListItem> {
  protected readonly singularKey = 'order_payment';
  protected readonly pluralKey = 'order_payments';

  protected readonly fields: FieldDef[] = [
    { key: 'id', type: 'int', readOnly: true },
    { key: 'id_currency', type: 'int' },
    { key: 'amount', type: 'string' },
    { key: 'date_add', type: 'string', readOnly: true },
    { key: 'order_reference', type: 'optionalString' },
    { key: 'payment_method', type: 'optionalString' },
    { key: 'conversion_rate', type: 'optionalString' },
    { key: 'transaction_id', type: 'optionalString' },
    { key: 'card_number', type: 'optionalString' },
    { key: 'card_brand', type: 'optionalString' },
    { key: 'card_expiration', type: 'optionalString' },
    { key: 'card_holder', type: 'optionalString' },
  ];
}
