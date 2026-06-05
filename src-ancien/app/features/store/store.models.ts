// Store-facing models (decoupled from PS internals)

export interface StoreProduct {
  id: number;
  name: string;
  reference: string;
  price: number;         // TTC
  quantity: number;
  description?: string;
  imageUrl?: string;
  hasCombinations: boolean;
  categoryId?: number;
  dateAvailability?: string;  // ISO date — used for HOT/NEW badges
}

export interface StoreVariant {
  combinationId: number;
  label: string;
  priceImpact: number;   // extra TTC amount
}

export interface StoreCategory {
  id: number;
  name: string;
}

export interface StoreUser {
  id: number;            // 0 = anonymous
  name: string;
  city: string;
}

// ── PrestaShop-backed order views (confirmation / my-orders) ─────────────────

export interface StoreOrderItemView {
  name: string;
  quantity: number;
  unitPrice: number;
}

/** A real PrestaShop order, mapped for storefront display. */
export interface StoreOrderView {
  id: number;
  reference: string;
  date: string;          // PS date_add
  items: StoreOrderItemView[];
  total: number;
  statusLabel: string;
  statusKey: 'pending' | 'paid' | 'cancelled';
}

export interface StoreCartLineView {
  name: string;
  quantity: number;
  unitPrice: number;
}

/** The customer's most recent PrestaShop cart, mapped for display. */
export interface StoreCartView {
  id: number;
  date: string;          // PS date_add
  lines: StoreCartLineView[];
  total: number;
}
