export interface WarehouseWritable {
  id_address: number;
  id_employee: number;
  id_currency: number;
  deleted: boolean;
  reference: string;
  name: string;
  management_type: string;
  associations: {
    stocks: { id: number }[];
    carriers: { id: number }[];
    shops: { id: number; name: string }[];
  };
}

export interface Warehouse extends WarehouseWritable {
  readonly id: number;
  readonly valuation: boolean;
}

export interface WarehouseListItem {
  id: number;
  href: string;
}
