export interface StockWritable {
  id_warehouse: number;
  id_product: number;
  id_product_attribute: number;
  reference: string;
  ean13: string;
  isbn: string;
  upc: string;
  mpn: string;
  physical_quantity: number;
  usable_quantity: number;
  price_te: string;
}

export interface Stock extends StockWritable {
  readonly id: number;
  readonly real_quantity: number;
}

export interface StockListItem {
  id: number;
  href: string;
}
