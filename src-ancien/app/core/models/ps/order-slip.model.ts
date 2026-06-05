export interface OrderSlipWritable {
  // ── required ──────────────────────────────────────────────────────────────
  id_customer:             number;
  id_order:                number;
  conversion_rate:         string;
  total_products_tax_excl: string;
  total_products_tax_incl: string;
  total_shipping_tax_excl: string;
  total_shipping_tax_incl: string;

  // ── optional ──────────────────────────────────────────────────────────────
  amount?:               string;
  shipping_cost?:        string;
  shipping_cost_amount?: string;
  partial?:              string;
  order_slip_type?:      number;
  date_add?:             string;
  date_upd?:             string;
  associations?: {
    order_slip_details: {
      id:               number;
      id_order_detail:  number;
      product_quantity: number;
      amount_tax_excl:  string;
      amount_tax_incl:  string;
    }[];
  };
}

export interface OrderSlip extends OrderSlipWritable {
  readonly id: number;
}

export interface OrderSlipListItem {
  id: number;
  href: string;
}
