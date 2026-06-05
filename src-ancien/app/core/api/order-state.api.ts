import { Injectable } from '@angular/core';
import { PsBaseApi } from './ps-base.api';

@Injectable({ providedIn: 'root' })
export class OrderStateApi extends PsBaseApi {
  protected resource = 'order_states';
}
