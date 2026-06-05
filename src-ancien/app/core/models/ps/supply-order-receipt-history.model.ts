export interface SupplyOrderReceiptHistoryWritable {
  id_supply_order_detail: number;
  id_employee: number;
  id_supply_order_state: number;
  employee_firstname: string;
  employee_lastname: string;
  quantity: number;
  date_add: string;
}

export interface SupplyOrderReceiptHistory extends SupplyOrderReceiptHistoryWritable {
  readonly id: number;
}

export interface SupplyOrderReceiptHistoryListItem {
  id: number;
  href: string;
}
