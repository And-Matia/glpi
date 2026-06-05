import { PsLang } from './ps-shared.model';

export interface ProductWritable {
  price: string;

  id_manufacturer?: number | null;
  id_supplier?: number | null;
  id_category_default?: number;
  id_tax_rules_group?: number;
  id_shop_default?: number;
  new?: boolean;
  state?: number;
  product_type?: 'standard' | 'combinations' | 'pack' | 'virtual';
  is_virtual?: boolean;

  reference?: string;
  supplier_reference?: string;
  ean13?: string;
  isbn?: string;
  upc?: string;
  mpn?: string;
  location?: string;

  width?: string;
  height?: string;
  depth?: string;
  weight?: string;

  wholesale_price?: string;
  ecotax?: string;
  unity?: string;
  unit_price_ratio?: string;
  additional_shipping_cost?: string;

  minimal_quantity?: number;
  low_stock_threshold?: number | null;
  low_stock_alert?: boolean;
  quantity_discount?: boolean;
  advanced_stock_management?: boolean;
  pack_stock_type?: number;

  active?: boolean;
  available_for_order?: boolean;
  show_price?: boolean;
  online_only?: boolean;
  on_sale?: boolean;
  show_condition?: boolean;
  visibility?: 'both' | 'catalog' | 'search' | 'none';
  condition?: 'new' | 'used' | 'refurbished';
  indexed?: boolean;

  customizable?: number;
  text_fields?: number;
  uploadable_files?: number;

  cache_is_pack?: boolean;
  cache_has_attachments?: boolean;
  cache_default_attribute?: number | null;
  id_default_image?: number | null;
  id_default_combination?: number | null;
  position_in_category?: number | null;

  additional_delivery_times?: number;
  redirect_type?: string;
  id_type_redirected?: number;
  available_date?: string;
  date_add?: string;
  date_upd?: string;
  unit_price?: string;

  name?: PsLang[];
  description?: PsLang[];
  description_short?: PsLang[];
  meta_title?: PsLang[];
  meta_description?: PsLang[];
  meta_keywords?: PsLang[];
  link_rewrite?: PsLang[];
  available_now?: PsLang[];
  available_later?: PsLang[];
  delivery_in_stock?: PsLang[];
  delivery_out_stock?: PsLang[];

  associations?: {
    categories?: { id: number }[];
    images?: { id: number }[];
    combinations?: { id: number }[];
    product_option_values?: { id: number }[];
    product_features?: { id: number; id_feature_value: number }[];
    tags?: { id: number }[];
    stock_availables?: { id: number; id_product_attribute: number }[];
    attachments?: { id: number }[];
    accessories?: { id: number }[];
    product_bundle?: { id: number; id_product_attribute: number; quantity: number }[];
  };
}


export interface Product extends ProductWritable {
  readonly id: number;
  readonly manufacturer_name: string; // not writable per PS8 docs
  readonly quantity: number;          // not writable per PS8 docs
}

export interface ProductListItem {
  id: number;
  href: string;
}

export interface PsProduct {
  id: number;
  name: string;
  reference: string;
  price: string;
  active: boolean;
  description?: string;
  imageUrl?: string;
}
