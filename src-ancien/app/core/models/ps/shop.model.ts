export interface ShopWritable {
  id_shop_group: number;
  id_category: number;
  active: boolean;
  deleted: boolean;
  name: string;
  color: string;
  theme_name: string;
}

export interface Shop extends ShopWritable {
  readonly id: number;
}

export interface ShopListItem {
  id: number;
  href: string;
}
