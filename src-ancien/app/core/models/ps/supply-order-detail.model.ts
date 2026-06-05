export interface SupplyOrderDetailWritable {
  id_supply_order: number;
  id_product: number;
  id_product_attribute: number;
  reference: string;
  supplier_reference: string;
  name: string;
  ean13: string;
  isbn: string;
  upc: string;
  mpn: string;
  exchange_rate: string;
  unit_price_te: string;
  quantity_expected: number;
  quantity_received: number;
  price_te: string;
  discount_rate: string;
  discount_value_te: string;
  price_with_discount_te: string;
  tax_rate: string;
  tax_value: string;
  price_ti: string;
  tax_value_with_order_discount: string;
  price_with_order_discount_te: string;
}

export interface SupplyOrderDetail extends SupplyOrderDetailWritable {
  readonly id: number;
}

export interface SupplyOrderDetailListItem {
  id: number;
  href: string;
}
