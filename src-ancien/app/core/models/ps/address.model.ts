export interface AddressWritable {
  // ── required ──────────────────────────────────────────────────────────────
  id_country: number;
  alias:      string;
  lastname:   string;
  firstname:  string;
  address1:   string;
  city:       string;

  // ── optional ──────────────────────────────────────────────────────────────
  id_customer?:     number | null;
  id_manufacturer?: number | null;
  id_supplier?:     number | null;
  id_warehouse?:    number | null;
  id_state?:        number | null;
  company?:         string;
  vat_number?:      string;
  address2?:        string;
  postcode?:        string;
  other?:           string;
  phone?:           string;
  phone_mobile?:    string;
  dni?:             string;
  deleted?:         boolean;
  date_add?:        string;
  date_upd?:        string;
}

export interface Address extends AddressWritable {
  readonly id: number;
}

export interface AddressListItem {
  id: number;
  href: string;
}
