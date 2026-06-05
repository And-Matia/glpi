import { Injectable } from '@angular/core';
import { PsBaseApi } from './ps-base.api';

@Injectable({ providedIn: 'root' })
export class OrderDetailApi extends PsBaseApi {
  protected resource = 'order_details';
}
