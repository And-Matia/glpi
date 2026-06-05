import { Injectable } from '@angular/core';
import { FieldMapSerializer, FieldDef } from './field-map.serializer';
import { OrderTransition, OrderTransitionListItem, OrderTransitionWritable } from '@app/core/models/ps/order-transition.model';

@Injectable({ providedIn: 'root' })
export class OrderTransitionSerializer extends FieldMapSerializer<OrderTransition, OrderTransitionWritable, OrderTransitionListItem> {
  protected readonly singularKey = 'order_transition';
  protected readonly pluralKey = 'order_transitions';

  protected readonly fields: FieldDef[] = [
    { key: 'id', type: 'int', readOnly: true },
    { key: 'id_order', type: 'int' },
    { key: 'id_order_state', type: 'int' },
  ];
}


