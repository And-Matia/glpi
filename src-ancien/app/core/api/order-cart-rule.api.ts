import { Injectable } from '@angular/core';
import { PsBaseApi } from './ps-base.api';

@Injectable({ providedIn: 'root' })
export class OrderCartRuleApi extends PsBaseApi {
  protected resource = 'order_cart_rules';
}
