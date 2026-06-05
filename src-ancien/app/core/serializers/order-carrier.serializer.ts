import { Injectable } from '@angular/core';
import { FieldMapSerializer, FieldDef } from './field-map.serializer';
import { OrderCarrier, OrderCarrierListItem, OrderCarrierWritable } from '../models/ps/order-carrier.model';
@Injectable({ providedIn: 'root' })
export class OrderCarrierSerializer extends FieldMapSerializer<OrderCarrier, OrderCarrierWritable, OrderCarrierListItem> {
  protected readonly singularKey = 'order_carrier';
  protected readonly pluralKey = 'order_carriers';

  protected readonly fields: FieldDef[] = [
    { key: 'id', type: 'int', readOnly: true },
    { key: 'id_order', type: 'int' },
    { key: 'id_carrier', type: 'int' },
    { key: 'id_order_invoice', type: 'nullableInt' },
    { key: 'weight', type: 'string' },
    { key: 'shipping_cost_tax_excl', type: 'string' },
    { key: 'shipping_cost_tax_incl', type: 'string' },
    { key: 'tracking_number', type: 'string' },
    { key: 'date_add', type: 'string' },
  ];
}
