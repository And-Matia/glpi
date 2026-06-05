import { Injectable } from '@angular/core';
import { FieldMapSerializer, FieldDef } from './field-map.serializer';
import { OrderState, OrderStateListItem, OrderStateWritable } from '../models/ps/order-state.model';
@Injectable({ providedIn: 'root' })
export class OrderStateSerializer extends FieldMapSerializer<OrderState, OrderStateWritable, OrderStateListItem> {
  protected readonly singularKey = 'order_state';
  protected readonly pluralKey = 'order_states';

  protected readonly fields: FieldDef[] = [
    { key: 'id', type: 'int', readOnly: true },
    { key: 'unremovable', type: 'bool' },
    { key: 'delivery', type: 'bool' },
    { key: 'hidden', type: 'bool' },
    { key: 'send_email', type: 'bool' },
    { key: 'invoice', type: 'bool' },
    { key: 'logable', type: 'bool' },
    { key: 'shipped', type: 'bool' },
    { key: 'paid', type: 'bool' },
    { key: 'pdf_delivery', type: 'bool' },
    { key: 'pdf_invoice', type: 'bool' },
    { key: 'deleted', type: 'bool' },
    { key: 'color', type: 'string' },
    { key: 'module_name', type: 'string' },
    { key: 'name', type: 'lang' },
    { key: 'template', type: 'lang' },
  ];
}
