import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { OrderDetailApi } from '@app/core/api/order-detail.api';
import { OrderDetail, OrderDetailListItem, OrderDetailWritable } from '../models/ps/order-detail.model';
import { OrderDetailSerializer } from '../serializers/order-detail.serializer';
import { PsBaseService } from './ps-base.service';

@Injectable({ providedIn: 'root' })
export class OrderDetailService extends PsBaseService<OrderDetail, OrderDetailWritable, OrderDetailListItem> {
  protected api        = inject(OrderDetailApi);
  protected serializer = inject(OrderDetailSerializer);

  getByOrder(idOrder: number): Observable<OrderDetailListItem[]> {
    return this.getAll({ 'filter[id_order]': idOrder });
  }
}
