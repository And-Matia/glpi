import { PsLang } from './ps-shared.model';

export interface CountryWritable {
  // ── required ──────────────────────────────────────────────────────────────
  id_zone:                    number;
  iso_code:                   string;
  contains_states:            boolean;
  need_identification_number: boolean;
  display_tax_label:          boolean;
  name:                       PsLang[];

  // ── optional ──────────────────────────────────────────────────────────────
  id_currency?:     number | null;
  call_prefix?:     number;
  active?:          boolean;
  need_zip_code?:   boolean;
  zip_code_format?: string;
}

export interface Country extends CountryWritable {
  readonly id: number;
}

export interface CountryListItem {
  id: number;
  href: string;
}
