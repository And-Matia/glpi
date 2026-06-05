import { inject, Injectable } from '@angular/core';
import { OrderPaymentApi } from '../api/order-payment.api';
import { OrderPayment, OrderPaymentListItem, OrderPaymentWritable } from '../models/ps/order-payment.model';
import { OrderPaymentSerializer } from '@app/core/serializers/order-payment.serializer';
import { PsBaseService } from './ps-base.service';

@Injectable({ providedIn: 'root' })
export class OrderPaymentService extends PsBaseService<OrderPayment, OrderPaymentWritable, OrderPaymentListItem> {
  protected api        = inject(OrderPaymentApi);
  protected serializer = inject(OrderPaymentSerializer);
}
