import { inject, Injectable } from '@angular/core';
import { OrderCartRuleApi } from '@app/core/api/order-cart-rule.api';
import { OrderCartRule, OrderCartRuleListItem, OrderCartRuleWritable } from '../models/ps/order-cart-rule.model';
import { OrderCartRuleSerializer } from '../serializers/order-cart-rule.serializer';
import { PsBaseService } from './ps-base.service';

@Injectable({ providedIn: 'root' })
export class OrderCartRuleService extends PsBaseService<OrderCartRule, OrderCartRuleWritable, OrderCartRuleListItem> {
  protected api        = inject(OrderCartRuleApi);
  protected serializer = inject(OrderCartRuleSerializer);
}
