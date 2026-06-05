export interface OrderHistoryWritable {
  // ── required ──────────────────────────────────────────────────────────────
  id_order_state: number;
  id_order:       number;

  // ── optional ──────────────────────────────────────────────────────────────
  id_employee?: number | null;
  date_add?:    string;
}

export interface OrderHistory extends OrderHistoryWritable {
  readonly id: number;
}

export interface OrderHistoryListItem {
  id: number;
  href: string;
}
