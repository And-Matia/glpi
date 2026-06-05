export interface CustomerThreadWritable {
  id_lang: number;
  id_shop: number | null;
  id_customer: number | null;
  id_order: number | null;
  id_product: number | null;
  id_contact: number;
  email: string;
  token: string;
  status: string;
  date_add: string;
  date_upd: string;
  associations: {
    customer_messages: { id: number }[];
  };
}

export interface CustomerThread extends CustomerThreadWritable {
  readonly id: number;
}

export interface CustomerThreadListItem {
  id: number;
  href: string;
}
