export interface OrderTransitionWritable {
  id_order: number;
  id_order_state: number; // Only accept 5 (Delivered) or 6 (Cancelled)
  date_add?: string;      // optional — included in the request only when provided
}

export interface OrderTransition extends OrderTransitionWritable {
  readonly id: number;
}

export interface OrderTransitionListItem {
  id: number;
  href: string;
}

