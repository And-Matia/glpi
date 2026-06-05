export interface SupplyOrderHistoryWritable {
  id_supply_order: number;
  id_employee: number;
  id_state: number;
  employee_firstname: string;
  employee_lastname: string;
  date_add: string;
}

export interface SupplyOrderHistory extends SupplyOrderHistoryWritable {
  readonly id: number;
}

export interface SupplyOrderHistoryListItem {
  id: number;
  href: string;
}
