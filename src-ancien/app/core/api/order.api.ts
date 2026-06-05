import { Injectable } from '@angular/core';
import { PsBaseApi } from './ps-base.api';

@Injectable({ providedIn: 'root' })
export class OrderApi extends PsBaseApi {
  protected resource = 'orders';
}
