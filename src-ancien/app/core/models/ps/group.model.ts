import { PsLang } from './ps-shared.model';

export interface GroupWritable {
  reduction: string;
  price_display_method: number;
  show_prices: boolean;
  name: PsLang[];
}

export interface Group extends GroupWritable {
  readonly id: number;
  readonly date_add: string;
  readonly date_upd: string;
}

export interface GroupListItem {
  id: number;
  href: string;
}
