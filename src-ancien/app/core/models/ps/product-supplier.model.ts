export interface ProductSupplierWritable {
  id_product: number;
  id_product_attribute: number;
  id_supplier: number;
  id_currency: number | null;
  product_supplier_reference: string;
  product_supplier_price_te: string;
}

export interface ProductSupplier extends ProductSupplierWritable {
  readonly id: number;
}

export interface ProductSupplierListItem {
  id: number;
  href: string;
}
