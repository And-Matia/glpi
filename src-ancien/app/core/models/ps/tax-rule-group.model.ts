export interface TaxRuleGroupWritable {
  name: string;
  active?: boolean;
  deleted?: boolean;
  date_add?: string;
  date_upd?: string;
}

export interface TaxRuleGroup extends TaxRuleGroupWritable {
  readonly id: number;
}

export interface TaxRuleGroupListItem {
  id: number;
  href: string;
}
