export interface ColumnMapping {
  csvColumn:    string;
  psField:      string | null;
  transformer?: string;
}

export interface CsvPreview {
  headers:       string[];
  preview:       string[][];
  separator:     string;
  estimatedRows: number;
}
