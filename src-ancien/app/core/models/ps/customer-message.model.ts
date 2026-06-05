export interface CustomerMessageWritable {
  id_employee: number | null;
  id_customer_thread: number | null;
  ip_address: string;
  message: string;
  file_name: string;
  user_agent: string;
  private: boolean;
  read: boolean;
  date_add: string;
  date_upd: string;
}

export interface CustomerMessage extends CustomerMessageWritable {
  readonly id: number;
}

export interface CustomerMessageListItem {
  id: number;
  href: string;
}
