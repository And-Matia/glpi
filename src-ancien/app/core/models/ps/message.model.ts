export interface MessageWritable {
  id_cart: number | null;
  id_order: number | null;
  id_customer: number | null;
  id_employee: number | null;
  message: string;
  private: boolean;
  date_add: string;
}

export interface Message extends MessageWritable {
  readonly id: number;
}

export interface MessageListItem {
  id: number;
  href: string;
}
