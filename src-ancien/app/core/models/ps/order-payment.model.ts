export interface OrderPaymentWritable {
  // ── required ──────────────────────────────────────────────────────────────
  id_currency: number;
  amount:      string;

  // ── optional ──────────────────────────────────────────────────────────────
  order_reference?: string;
  payment_method?:  string;
  conversion_rate?: string;
  transaction_id?:  string;
  card_number?:     string;
  card_brand?:      string;
  card_expiration?: string;
  card_holder?:     string;
}

export interface OrderPayment extends OrderPaymentWritable {
  readonly id:       number;
  readonly date_add: string;   // set by PS on creation, not writable
}

export interface OrderPaymentListItem {
  id: number;
  href: string;
}
