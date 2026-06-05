export interface CombinationWritable {
  id_product: number;
  minimal_quantity: number;

  location?: string;
  ean13?: string;
  isbn?: string;
  upc?: string;
  mpn?: string;
  quantity?: number;
  reference?: string;
  supplier_reference?: string;
  wholesale_price?: string;
  price?: string;
  ecotax?: string;
  weight?: string;
  unit_price_impact?: string;
  low_stock_threshold?: number;
  low_stock_alert?: boolean;
  default_on?: boolean;
  available_date?: string;
  associations?: {
    product_option_values?: { id: number }[];
    images?: { id: number }[];
  };
}

export interface Combination extends CombinationWritable {
  readonly id: number;
}

export interface CombinationListItem {
  id: number;
  href: string;
}
