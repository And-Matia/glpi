import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { OrderSlipApi } from '@app/core/api/order-slip.api';
import { OrderSlip, OrderSlipListItem, OrderSlipWritable } from '../models/ps/order-slip.model';
import { OrderSlipSerializer } from '../serializers/order-slip.serializer';
import { PsBaseService } from './ps-base.service';

@Injectable({ providedIn: 'root' })
export class OrderSlipService extends PsBaseService<OrderSlip, OrderSlipWritable, OrderSlipListItem> {
  protected api        = inject(OrderSlipApi);
  protected serializer = inject(OrderSlipSerializer);

  getByOrder(idOrder: number): Observable<OrderSlipListItem[]> {
    return this.getAll({ 'filter[id_order]': idOrder });
  }
}
