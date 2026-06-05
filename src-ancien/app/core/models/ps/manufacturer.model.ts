import { PsLang } from './ps-shared.model';

export interface ManufacturerWritable {
  name: string;
  active: boolean;
  date_add: string;
  date_upd: string;
  description: PsLang[];
  short_description: PsLang[];
  meta_title: PsLang[];
  meta_description: PsLang[];
  meta_keywords: PsLang[];
  associations: {
    addresses: { id: number }[];
  };
}

export interface Manufacturer extends ManufacturerWritable {
  readonly id: number;
  readonly link_rewrite: string;
}

export interface ManufacturerListItem {
  id: number;
  href: string;
}
