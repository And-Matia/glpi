export interface CustomerWritable {
  passwd: string;
  lastname: string;
  firstname: string;
  email: string;

  id_gender?: number;
  id_default_group?: number;
  id_lang?: number;
  id_shop?: number;
  id_shop_group?: number;
  id_risk?: number;
  birthday?: string;
  website?: string;
  company?: string;
  siret?: string;
  ape?: string;
  outstanding_allow_amount?: string;
  max_payment_days?: number;
  newsletter?: boolean;
  optin?: boolean;
  newsletter_date_add?: string;
  ip_registration_newsletter?: string;
  active?: boolean;
  deleted?: boolean;
  is_guest?: boolean;
  note?: string;
  show_public_prices?: boolean;
  date_add?: string;
  date_upd?: string;
  reset_password_token?: string;
  reset_password_validity?: string | null;
  associations?: {
    groups: { id: number }[];
  };
}

export interface Customer extends CustomerWritable {
  readonly id: number;
  readonly secure_key: string;
  readonly last_passwd_gen: string;
}

export interface CustomerListItem {
  id: number;
  href: string;
}
