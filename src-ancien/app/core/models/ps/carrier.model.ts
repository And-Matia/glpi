import { PsLang } from './ps-shared.model';

export interface CarrierWritable {
  // ── required ──────────────────────────────────────────────────────────────
  name:   string;
  active: boolean;
  delay:  PsLang[];

  // ── optional ──────────────────────────────────────────────────────────────
  id_tax_rules_group?:   number;
  id_reference?:         number;
  is_free?:              boolean;
  url?:                  string;
  shipping_handling?:    boolean;
  shipping_external?:    boolean;
  range_behavior?:       boolean;
  shipping_method?:      number;
  max_width?:            number;
  max_height?:           number;
  max_depth?:            number;
  max_weight?:           string;
  grade?:                number;
  external_module_name?: string;
  need_range?:           boolean;
  position?:             number;
  deleted?:              boolean;
  is_module?:            boolean;
}

export interface Carrier extends CarrierWritable {
  readonly id: number;
}

export interface CarrierListItem {
  id: number;
  href: string;
}
