import { inject, Injectable } from '@angular/core';
import { OrderStateApi } from '../api/order-state.api';
import { OrderState, OrderStateListItem, OrderStateWritable } from '../models/ps/order-state.model';
import { OrderStateSerializer } from '../serializers/order-state.serializer';
import { PsBaseService } from './ps-base.service';
import { resolveOrderStateByName } from '../constants/order-states.constants';

@Injectable({ providedIn: 'root' })
export class OrderStateService extends PsBaseService<
  OrderState,
  OrderStateWritable,
  OrderStateListItem
> {
  protected api = inject(OrderStateApi);
  protected serializer = inject(OrderStateSerializer);

  resolveByName(name: string): number | null {
    return resolveOrderStateByName(name);
  }
}
