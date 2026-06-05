export interface OrderDetailWritable {
  // ── required ──────────────────────────────────────────────────────────────
  id_order:         number;
  id_warehouse:     number;
  id_shop:          number;
  product_name:     string;
  product_quantity: number;
  product_price:    string;

  // ── optional ──────────────────────────────────────────────────────────────
  id_order_invoice?:            number | null;
  id_customization?:            number | null;
  product_id?:                  number | null;
  product_attribute_id?:        number | null;
  product_quantity_in_stock?:   number;
  product_quantity_return?:     number;
  product_quantity_refunded?:   number;
  product_quantity_reinjected?: number;
  reduction_percent?:           string;
  reduction_amount?:            string;
  reduction_amount_tax_incl?:   string;
  reduction_amount_tax_excl?:   string;
  group_reduction?:             string;
  product_quantity_discount?:   string;
  product_ean13?:               string;
  product_isbn?:                string;
  product_upc?:                 string;
  product_mpn?:                 string;
  product_reference?:           string;
  product_supplier_reference?:  string;
  product_weight?:              string;
  tax_computation_method?:      number;
  id_tax_rules_group?:          number;
  ecotax?:                      string;
  ecotax_tax_rate?:             string;
  discount_quantity_applied?:   number;
  download_hash?:               string;
  download_nb?:                 number;
  download_deadline?:           string;
  unit_price_tax_incl?:         string;
  unit_price_tax_excl?:         string;
  total_price_tax_incl?:        string;
  total_price_tax_excl?:        string;
  total_shipping_price_tax_excl?: string;
  total_shipping_price_tax_incl?: string;
  purchase_supplier_price?:     string;
  original_product_price?:      string;
  original_wholesale_price?:    string;
  total_refunded_tax_excl?:     string;
  total_refunded_tax_incl?:     string;
  associations?: {
    taxes: { id: number }[];
  };
}

export interface OrderDetail extends OrderDetailWritable {
  readonly id: number;
}

export interface OrderDetailListItem {
  id: number;
  href: string;
}
