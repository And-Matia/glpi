import { Injectable } from '@angular/core';
import { PsBaseApi } from './ps-base.api';

@Injectable({ providedIn: 'root' })
export class OrderPaymentApi extends PsBaseApi {
  protected resource = 'order_payments';
}
