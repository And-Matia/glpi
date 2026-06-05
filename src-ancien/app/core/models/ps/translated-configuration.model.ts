import { PsLang } from './ps-shared.model';

export interface TranslatedConfigurationWritable {
  name: string;
  value: PsLang[];
  id_shop_group: number | null;
  id_shop: number | null;
  date_add: string;
  date_upd: string;
}

export interface TranslatedConfiguration extends TranslatedConfigurationWritable {
  readonly id: number;
}

export interface TranslatedConfigurationListItem {
  id: number;
  href: string;
}
