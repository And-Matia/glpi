export type ResetResource =
  // ── Stock movements ───────────────────────────────────────────────────────
  | 'stock_movements'
  // ── Order resources (delete children first) ───────────────────────────────
  | 'order_cart_rules'
  | 'order_payments'
  | 'order_slip'
  | 'order_invoices'
  | 'order_carriers'
  | 'order_histories'
  | 'order_details'
  | 'orders'
  | 'carts'
  | 'addresses'
  | 'customers'
  // ── Catalog resources ─────────────────────────────────────────────────────
  | 'combinations'
  | 'product_option_values'
  | 'product_options'
  | 'products'
  | 'categories'
  | 'tax_rule_groups'
  | 'taxes';

export interface ProgressInfo {
  endpoint: ResetResource | '';
  phase: 'fetching' | 'deleting' | 'done';
  itemsDone: number;
  itemsTotal: number;
  endpointsDone: number;
  endpointsTotal: number;
}

export interface FailedItem {
  endpoint: ResetResource;
  id: number;
  error: string;
}

export interface EndpointStat {
  endpoint: ResetResource;
  beforeCount: number;
  afterCount: number;
}

export interface ResetResult {
  success: ResetResource[];
  failed: FailedItem[];
  stats: EndpointStat[];
}
