import { Injectable } from '@angular/core';
import { PsBaseApi } from './ps-base.api';

@Injectable({ providedIn: 'root' })
export class OrderSlipApi extends PsBaseApi {
  protected resource = 'order_slip';
}
