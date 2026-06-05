export interface SpecificPriceRuleWritable {
  id_shop: number;
  id_country: number;
  id_currency: number;
  id_group: number;
  name: string;
  from_quantity: number;
  price: string;
  reduction: string;
  reduction_tax: boolean;
  reduction_type: 'amount' | 'percentage';
  from: string;
  to: string;
}

export interface SpecificPriceRule extends SpecificPriceRuleWritable {
  readonly id: number;
}

export interface SpecificPriceRuleListItem {
  id: number;
  href: string;
}
