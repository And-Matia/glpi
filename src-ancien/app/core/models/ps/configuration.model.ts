export interface ConfigurationWritable {
  name: string;
  value: string;
  id_shop_group: number | null;
  id_shop: number | null;
  date_add: string;
  date_upd: string;
}

export interface Configuration extends ConfigurationWritable {
  readonly id: number;
}

export interface ConfigurationListItem {
  id: number;
  href: string;
}
