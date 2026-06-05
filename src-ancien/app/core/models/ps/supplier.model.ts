import { PsLang } from './ps-shared.model';

export interface SupplierWritable {
  name: string;
  active: boolean;
  date_add: string;
  date_upd: string;
  description: PsLang[];
  meta_title: PsLang[];
  meta_description: PsLang[];
  meta_keywords: PsLang[];
}

export interface Supplier extends SupplierWritable {
  readonly id: number;
  readonly link_rewrite: string;
}

export interface SupplierListItem {
  id: number;
  href: string;
}
