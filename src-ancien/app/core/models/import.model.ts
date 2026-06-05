export interface ProductCategoryRow {
  dateAvailability: string; // YYYY-MM-DD
  nom:              string;
  reference:        string;
  prixTtc:          number;
  taxePercent:      number; // e.g. 11.65 (not 0.1165)
  categorie:        string;
  prixAchat:        number;
}

export interface CombinationRow {
  reference:    string;
  specificite:  string;
  karazany:     string;
  stockInitial: number;
  prixVenteTtc: number | null;
}

export interface OrderItem {
  reference: string;
  qty:       number;
  variant:   string; // option-value name, empty for simple product
}

export interface OrderRow {
  date:    string; // YYYY-MM-DD
  nom:     string;
  email:   string;
  pwd:     string;
  adresse: string;
  items:   OrderItem[];
  etat:    string;
}

export interface ImportStats {
  total:   number;
  success: number;
  failed:  number;
  errors:  { row: number; error: string }[];
}
