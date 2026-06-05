export interface OrderInvoiceWritable {
  // ── required ──────────────────────────────────────────────────────────────
  id_order: number;
  number:   number;

  // ── optional ──────────────────────────────────────────────────────────────
  delivery_number?:                 number;
  delivery_date?:                   string;
  total_discount_tax_excl?:         string;
  total_discount_tax_incl?:         string;
  total_paid_tax_excl?:             string;
  total_paid_tax_incl?:             string;
  total_products?:                  string;
  total_products_wt?:               string;
  total_shipping_tax_excl?:         string;
  total_shipping_tax_incl?:         string;
  shipping_tax_computation_method?: string;
  total_wrapping_tax_excl?:         string;
  total_wrapping_tax_incl?:         string;
  shop_address?:                    string;
  note?:                            string;
  date_add?:                        string;
}

export interface OrderInvoice extends OrderInvoiceWritable {
  readonly id: number;
}

export interface OrderInvoiceListItem {
  id: number;
  href: string;
}
