import { Injectable } from '@angular/core';
import { FieldMapSerializer, FieldDef } from './field-map.serializer';
import { OrderHistory, OrderHistoryListItem, OrderHistoryWritable } from '../models/ps/order-history.model';
@Injectable({ providedIn: 'root' })
export class OrderHistorySerializer extends FieldMapSerializer<OrderHistory, OrderHistoryWritable, OrderHistoryListItem> {
  protected readonly singularKey = 'order_history';
  protected readonly pluralKey = 'order_histories';

  protected readonly fields: FieldDef[] = [
    { key: 'id', type: 'int', readOnly: true },
    { key: 'id_order_state', type: 'int' },
    { key: 'id_order', type: 'int' },
    { key: 'id_employee', type: 'nullableInt' },
    { key: 'date_add', type: 'string' },
  ];
}
