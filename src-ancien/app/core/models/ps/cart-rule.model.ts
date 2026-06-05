import { PsLang } from './ps-shared.model';

export interface CartRuleWritable {
  id_customer: number | null;
  date_from: string;
  date_to: string;
  description: string;
  quantity: number;
  quantity_per_user: number;
  priority: number;
  partial_use: boolean;
  code: string;
  minimum_amount: string;
  minimum_amount_tax: boolean;
  minimum_amount_currency: number;
  minimum_amount_shipping: boolean;
  country_restriction: boolean;
  carrier_restriction: boolean;
  group_restriction: boolean;
  cart_rule_restriction: boolean;
  product_restriction: boolean;
  shop_restriction: boolean;
  free_shipping: boolean;
  reduction_percent: string;
  reduction_amount: string;
  reduction_tax: boolean;
  reduction_currency: number;
  reduction_product: number;
  reduction_exclude_special: boolean;
  gift_product: number;
  gift_product_attribute: number;
  highlight: boolean;
  active: boolean;
  date_add: string;
  date_upd: string;
  name: PsLang[];
}

export interface CartRule extends CartRuleWritable {
  readonly id: number;
}

export interface CartRuleListItem {
  id: number;
  href: string;
}
