export interface LanguageWritable {
  // ── required ──────────────────────────────────────────────────────────────
  name:             string;
  iso_code:         string;
  date_format_lite: string;
  date_format_full: string;

  // ── optional ──────────────────────────────────────────────────────────────
  locale?:        string;
  language_code?: string;
  active?:        boolean;
  is_rtl?:        boolean;
}

export interface Language extends LanguageWritable {
  readonly id: number;
}

export interface LanguageListItem {
  id: number;
  href: string;
}
