/** Parses one CSV line, handling quoted fields with escaped internal quotes. */
export function parseCsvLine(line: string): string[] {
  const fields: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === ',' && !inQuotes) {
      fields.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  fields.push(current);
  return fields;
}

export interface ParseResult<T> {
  rows: T[];
  errors: { row: number; error: string }[];
}

/**
 * Parses a CSV file text.
 * `mapper` receives a header→value record and must return the typed row or throw.
 */
export function parseCsvText<T>(
  text: string,
  mapper: (record: Record<string, string>, lineNumber: number) => T,
): ParseResult<T> {
  const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim().split('\n');
  const headers = parseCsvLine(lines[0]).map(h => h.trim());

  const rows: T[] = [];
  const errors: { row: number; error: string }[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    try {
      const values = parseCsvLine(line);
      const record: Record<string, string> = {};
      headers.forEach((h, j) => (record[h] = (values[j] ?? '').trim()));
      rows.push(mapper(record, i + 1));
    } catch (e) {
      errors.push({row: i + 1, error: e instanceof Error ? e.message : String(e)});
    }
  }

  return {rows, errors};
}

/** Converts a French decimal string "8,7" → 8.7 */
export function parseFrenchFloat(value: string): number {
  return parseFloat(value.replace(',', '.')) || 0;
}
