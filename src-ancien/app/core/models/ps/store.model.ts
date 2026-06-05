import { PsLang } from './ps-shared.model';

export interface StoreWritable {
  id_country: number;
  id_state: number | null;
  hours: string;
  postcode: string;
  city: string;
  latitude: string;
  longitude: string;
  phone: string;
  fax: string;
  email: string;
  active: boolean;
  date_add: string;
  date_upd: string;
  name: PsLang[];
  address1: PsLang[];
  address2: PsLang[];
  note: PsLang[];
}

export interface Store extends StoreWritable {
  readonly id: number;
}

export interface StoreListItem {
  id: number;
  href: string;
}
