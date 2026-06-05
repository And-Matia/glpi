export interface ShopGroupWritable {
  name: string;
  color: string;
  share_customer: boolean;
  share_order: boolean;
  share_stock: boolean;
  active: boolean;
  deleted: boolean;
}

export interface ShopGroup extends ShopGroupWritable {
  readonly id: number;
}

export interface ShopGroupListItem {
  id: number;
  href: string;
}
