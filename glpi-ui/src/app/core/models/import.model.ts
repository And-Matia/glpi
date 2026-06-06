export interface ImportStats {
  total:   number;
  success: number;
  failed:  number;
  errors:  { row: number; error: string }[];
}
