import {ImportStats} from '@app/core/models';

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

function extractErrorText(err: unknown): string {
  if (err && typeof err === 'object' && 'error' in err) {
    const body = (err as { error: unknown }).error;
    if (Array.isArray(body)) return body.join(' — ');
    if (typeof body === 'string') return body;
  }
  return err instanceof Error ? err.message : String(err);
}

export async function runCsvImport<T>(
  parsed: ParseResult<T>,
  importRow: (row: T) => Promise<void>,
): Promise<ImportStats> {
  const stats: ImportStats = {
    total: parsed.rows.length + parsed.errors.length,
    success: 0,
    failed: parsed.errors.length,
    errors: [...parsed.errors],
  };

  for (let i = 0; i < parsed.rows.length; i++) {
    try {
      await importRow(parsed.rows[i]);
      stats.success++;
    } catch (err) {
      stats.failed++;
      stats.errors.push({row: i + 2, error: extractErrorText(err)});
    }
  }

  return stats;
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
