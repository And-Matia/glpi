export interface OrderWritable {
  // ── required ──────────────────────────────────────────────────────────────
  id_address_delivery: number;
  id_address_invoice:  number;
  id_cart:             number;
  id_currency:         number;
  id_lang:             number;
  id_customer:         number;
  id_carrier:          number;
  module:              string;
  payment:             string;
  total_paid:          string;
  total_paid_real:     string;
  total_products:      string;
  total_products_wt:   string;
  conversion_rate:     string;

  // ── optional ──────────────────────────────────────────────────────────────
  id_shop_group?:             number | null;
  id_shop?:                   number | null;
  current_state?:             number | null;
  secure_key?:                string;
  reference?:                 string;
  recyclable?:                boolean;
  gift?:                      boolean;
  gift_message?:              string;
  mobile_theme?:              boolean;
  total_discounts?:           string;
  total_discounts_tax_incl?:  string;
  total_discounts_tax_excl?:  string;
  total_paid_tax_incl?:       string;
  total_paid_tax_excl?:       string;
  total_shipping?:            string;
  total_shipping_tax_incl?:   string;
  total_shipping_tax_excl?:   string;
  carrier_tax_rate?:          string;
  total_wrapping?:            string;
  total_wrapping_tax_incl?:   string;
  total_wrapping_tax_excl?:   string;
  shipping_number?:           string;
  invoice_number?:            number;
  delivery_number?:           number;
  invoice_date?:              string;
  delivery_date?:             string;
  valid?:                     boolean;
  note?:                      string;
  round_mode?:                number;
  round_type?:                number;
  date_add?:                  string;
  date_upd?:                  string;
  associations?: {
    order_rows: {
      id:                    number;
      product_id:            number;
      product_attribute_id:  number;
      product_quantity:      number;
      product_name:          string;
      product_reference:     string;
      product_ean13:         string;
      product_isbn:          string;
      product_upc:           string;
      product_price:         string;
      id_customization:      number;
      unit_price_tax_incl:   string;
      unit_price_tax_excl:   string;
    }[];
  };
}

export interface Order extends OrderWritable {
  readonly id: number;
}

/** @deprecated use Order */
export type PsOrder = Order;

export interface OrderListItem {
  id: number;
  href: string;
}

export interface PsOrderState {
  id:   number;
  name: string;
}

export const ORDER_STATES: PsOrderState[] = [
  { id: 6,  name: 'annulé' },
  { id: 8,  name: 'paiement effectué' },
  { id: 13, name: 'échec paiement' },
];
