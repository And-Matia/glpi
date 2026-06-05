import { Injectable } from '@angular/core';
import { FieldMapSerializer, FieldDef } from './field-map.serializer';
import { OrderCartRule, OrderCartRuleListItem, OrderCartRuleWritable } from '../models/ps/order-cart-rule.model';
@Injectable({ providedIn: 'root' })
export class OrderCartRuleSerializer extends FieldMapSerializer<OrderCartRule, OrderCartRuleWritable, OrderCartRuleListItem> {
  protected readonly singularKey = 'order_cart_rule';
  protected readonly pluralKey = 'order_cart_rules';

  protected readonly fields: FieldDef[] = [
    { key: 'id', type: 'int', readOnly: true },
    { key: 'id_order', type: 'int' },
    { key: 'id_cart_rule', type: 'int' },
    { key: 'id_order_invoice', type: 'nullableInt' },
    { key: 'name', type: 'string' },
    { key: 'value', type: 'string' },
    { key: 'value_tax_excl', type: 'string' },
    { key: 'free_shipping', type: 'bool' },
    { key: 'deleted', type: 'bool' },
  ];
}
