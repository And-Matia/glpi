export interface OrderCartRuleWritable {
  // ── required ──────────────────────────────────────────────────────────────
  id_order:       number;
  id_cart_rule:   number;
  name:           string;
  value:          string;
  value_tax_excl: string;

  // ── optional ──────────────────────────────────────────────────────────────
  id_order_invoice?: number | null;
  free_shipping?:    boolean;
  deleted?:          boolean;
}

export interface OrderCartRule extends OrderCartRuleWritable {
  readonly id: number;
}

export interface OrderCartRuleListItem {
  id: number;
  href: string;
}
