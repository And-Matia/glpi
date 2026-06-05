export interface StockAvailableWritable {
  id_product: number;
  id_product_attribute: number;
  id_shop?: number;
  id_shop_group?: number;
  quantity: number;
  depends_on_stock: boolean;
  out_of_stock: number;
  location?: string;
}

export interface StockAvailable extends StockAvailableWritable {
  readonly id: number;
}

export interface StockAvailableListItem {
  id: number;
  href: string;
}
