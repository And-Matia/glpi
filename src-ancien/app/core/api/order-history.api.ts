import { Injectable } from '@angular/core';
import { PsBaseApi } from './ps-base.api';

@Injectable({ providedIn: 'root' })
export class OrderHistoryApi extends PsBaseApi {
  protected resource = 'order_histories';
}
