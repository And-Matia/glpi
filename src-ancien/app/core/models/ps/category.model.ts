import { PsLang } from './ps-shared.model';

export interface CategoryWritable {
  active: boolean;         // required
  name: PsLang[];          // required
  link_rewrite: PsLang[];  // required

  id_parent?: number;
  id_shop_default?: number;
  is_root_category?: boolean;
  position?: number;
  date_add?: string;
  date_upd?: string;
  description?: PsLang[];
  meta_title?: PsLang[];
  meta_description?: PsLang[];
  meta_keywords?: PsLang[];
  associations?: {
    categories?: { id: number }[];
    products?: { id: number }[];
  };
}

export interface Category extends CategoryWritable {
  readonly id: number;
  readonly level_depth: number;         // not writable per PS8 docs
  readonly nb_products_recursive: number; // not writable per PS8 docs
}

export interface CategoryListItem {
  id: number;
  href: string;
}
