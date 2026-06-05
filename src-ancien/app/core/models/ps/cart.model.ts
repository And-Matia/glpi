export interface CartWritable {
  // ── required ──────────────────────────────────────────────────────────────
  id_currency: number;
  id_lang:     number;

  // ── optional ──────────────────────────────────────────────────────────────
  id_address_delivery?:     number | null;
  id_address_invoice?:      number | null;
  id_customer?:             number | null;
  id_guest?:                number | null;
  id_shop_group?:           number | null;
  id_shop?:                 number | null;
  id_carrier?:              number | null;
  recyclable?:              boolean;
  gift?:                    boolean;
  gift_message?:            string;
  mobile_theme?:            boolean;
  delivery_option?:         string;
  secure_key?:              string;
  allow_seperated_package?: boolean;
  date_add?:                string;
  date_upd?:                string;
  associations?: {
    cart_rows: {
      id_product:            number;
      id_product_attribute:  number;
      id_address_delivery:   number;
      id_customization:      number;
      quantity:              number;
    }[];
  };
}

export interface Cart extends CartWritable {
  readonly id: number;
}

export interface CartListItem {
  id: number;
  href: string;
}
