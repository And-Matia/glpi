import { inject, Injectable } from '@angular/core';
import { OrderCarrierApi } from '@app/core/api/order-carrier.api';
import { OrderCarrier, OrderCarrierListItem, OrderCarrierWritable } from '../models/ps/order-carrier.model';
import { OrderCarrierSerializer } from '../serializers/order-carrier.serializer';
import { PsBaseService } from './ps-base.service';

@Injectable({ providedIn: 'root' })
export class OrderCarrierService extends PsBaseService<OrderCarrier, OrderCarrierWritable, OrderCarrierListItem> {
  protected api        = inject(OrderCarrierApi);
  protected serializer = inject(OrderCarrierSerializer);
}
