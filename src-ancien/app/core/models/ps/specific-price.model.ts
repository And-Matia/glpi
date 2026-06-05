export interface SpecificPriceWritable {
  id_shop_group: number | null;
  id_shop: number;
  id_cart: number;
  id_product: number;
  id_product_attribute: number | null;
  id_currency: number;
  id_country: number;
  id_group: number;
  id_customer: number;
  id_specific_price_rule: number | null;
  price: string;
  from_quantity: number;
  reduction: string;
  reduction_tax: boolean;
  reduction_type: 'amount' | 'percentage';
  from: string;
  to: string;
}

export interface SpecificPrice extends SpecificPriceWritable {
  readonly id: number;
}

export interface SpecificPriceListItem {
  id: number;
  href: string;
}
