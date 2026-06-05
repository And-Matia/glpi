import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { OrderHistoryApi } from '@app/core/api/order-history.api';
import { OrderHistory, OrderHistoryListItem, OrderHistoryWritable } from '../models/ps/order-history.model';
import { OrderHistorySerializer } from '../serializers/order-history.serializer';
import { PsBaseService } from './ps-base.service';

@Injectable({ providedIn: 'root' })
export class OrderHistoryService extends PsBaseService<OrderHistory, OrderHistoryWritable, OrderHistoryListItem> {
  protected api        = inject(OrderHistoryApi);
  protected serializer = inject(OrderHistorySerializer);

  getByOrder(idOrder: number): Observable<OrderHistoryListItem[]> {
    return this.getAll({ 'filter[id_order]': idOrder });
  }

}
