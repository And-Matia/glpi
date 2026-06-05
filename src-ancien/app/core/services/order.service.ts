import { inject, Injectable } from '@angular/core';
import { OrderApi } from '../api/order.api';
import { Order, OrderListItem, OrderWritable } from '../models/ps/order.model';
import { OrderSerializer } from '../serializers/order.serializer';
import { PsBaseService } from './ps-base.service';

@Injectable({ providedIn: 'root' })
export class OrderService extends PsBaseService<Order, OrderWritable, OrderListItem> {
  protected api        = inject(OrderApi);
  protected serializer = inject(OrderSerializer);
}
