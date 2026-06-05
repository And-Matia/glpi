export interface DeliveryWritable {
  id_carrier: number;
  id_range_price: number;
  id_range_weight: number;
  id_zone: number;
  id_shop: number | null;
  id_shop_group: number | null;
  price: string;
}

export interface Delivery extends DeliveryWritable {
  readonly id: number;
}

export interface DeliveryListItem {
  id: number;
  href: string;
}
