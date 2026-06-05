import { PsLang } from './ps-shared.model';

export interface CurrencyWritable {
  // ── required ──────────────────────────────────────────────────────────────
  name:            string;
  iso_code:        string;
  conversion_rate: string;

  // ── optional ──────────────────────────────────────────────────────────────
  numeric_iso_code?: string;
  precision?:        number;
  deleted?:          boolean;
  active?:           boolean;
  unofficial?:       boolean;
  modified?:         boolean;
  names?:            PsLang[];
  symbol?:           PsLang[];
  pattern?:          PsLang[];
}

export interface Currency extends CurrencyWritable {
  readonly id: number;
}

export interface CurrencyListItem {
  id: number;
  href: string;
}
