export interface OrderCarrierWritable {
  // ── required ──────────────────────────────────────────────────────────────
  id_order:   number;
  id_carrier: number;

  // ── optional ──────────────────────────────────────────────────────────────
  id_order_invoice?:       number | null;
  weight?:                 string;
  shipping_cost_tax_excl?: string;
  shipping_cost_tax_incl?: string;
  tracking_number?:        string;
  date_add?:               string;
}

export interface OrderCarrier extends OrderCarrierWritable {
  readonly id: number;
}

export interface OrderCarrierListItem {
  id: number;
  href: string;
}
