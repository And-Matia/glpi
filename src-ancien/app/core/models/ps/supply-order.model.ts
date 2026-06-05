export interface SupplyOrderWritable {
  id_supplier: number;
  id_lang: number;
  id_warehouse: number;
  id_supply_order_state: number;
  id_currency: number;
  supplier_name: string;
  reference: string;
  date_delivery_expected: string;
  total_te: string;
  total_with_discount_te: string;
  total_ti: string;
  total_tax: string;
  discount_rate: string;
  discount_value_te: string;
  is_template: boolean;
  date_add: string;
  date_upd: string;
  associations: {
    supply_order_details: {
      id: number;
      id_product: number;
      id_product_attribute: number;
      supplier_reference: string;
      product_name: string;
    }[];
  };
}

export interface SupplyOrder extends SupplyOrderWritable {
  readonly id: number;
}

export interface SupplyOrderListItem {
  id: number;
  href: string;
}
