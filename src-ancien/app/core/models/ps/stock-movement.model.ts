import { PsLang } from './ps-shared.model';

export interface StockMovementWritable {
  id_stock: number;
  id_stock_mvt_reason: number;
  id_employee: number;
  id_product: number | null;
  id_product_attribute: number | null;
  id_warehouse: number | null;
  id_currency: number | null;
  id_order: number | null;
  id_supply_order: number | null;
  management_type: string;
  product_name: PsLang[];
  ean13: string;
  upc: string;
  reference: string;
  mpn: string;
  physical_quantity: number;
  sign: number;
  last_wa: string;
  current_wa: string;
  price_te: string;
  date_add: string;
}

export interface StockMovement extends StockMovementWritable {
  readonly id: number;
}

export interface StockMovementListItem {
  id: number;
  href: string;
}
