export interface ShopUrlWritable {
  id_shop: number;
  active: boolean;
  main: boolean;
  domain: string;
  domain_ssl: string;
  physical_uri: string;
  virtual_uri: string;
}

export interface ShopUrl extends ShopUrlWritable {
  readonly id: number;
}

export interface ShopUrlListItem {
  id: number;
  href: string;
}
