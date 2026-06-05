export interface TaxRuleWritable {
  //required
  id_tax_rules_group: number;
  id_country: number;
  id_tax: number;

  id_state?: number;
  zipcode_from?: string;
  zipcode_to?: string;
  behavior?: number;
  description?: string;
}

export interface TaxRule extends TaxRuleWritable {
  readonly id: number;
}

export interface TaxRuleListItem {
  id: number;
  href: string;
}
