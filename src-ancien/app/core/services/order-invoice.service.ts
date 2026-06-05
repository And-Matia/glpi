import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { OrderInvoiceApi } from '../api/order-invoice.api';
import { OrderInvoice, OrderInvoiceListItem, OrderInvoiceWritable } from '../models/ps/order-invoice.model';
import { OrderInvoiceSerializer } from '../serializers/order-invoice.serializer';
import { PsBaseService } from './ps-base.service';

@Injectable({ providedIn: 'root' })
export class OrderInvoiceService extends PsBaseService<OrderInvoice, OrderInvoiceWritable, OrderInvoiceListItem> {
  protected api        = inject(OrderInvoiceApi);
  protected serializer = inject(OrderInvoiceSerializer);

  getByOrder(idOrder: number): Observable<OrderInvoiceListItem[]> {
    return this.getAll({ 'filter[id_order]': idOrder });
  }
}
