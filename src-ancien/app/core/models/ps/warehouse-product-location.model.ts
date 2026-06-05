export interface WarehouseProductLocationWritable {
  id_product: number;
  id_product_attribute: number;
  id_warehouse: number;
  location: string;
}

export interface WarehouseProductLocation extends WarehouseProductLocationWritable {
  readonly id: number;
}

export interface WarehouseProductLocationListItem {
  id: number;
  href: string;
}
