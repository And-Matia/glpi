import { Injectable } from '@angular/core';
import { PsBaseApi } from './ps-base.api';

@Injectable({ providedIn: 'root' })
export class OrderInvoiceApi extends PsBaseApi {
  protected resource = 'order_invoices';
}
