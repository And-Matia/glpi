import { Injectable } from '@angular/core';
import Papa from 'papaparse';
import { CsvPreview } from '../models/import-result.model';
function deduplicateHeaders(raw: string[]): string[] {
  const seen = new Map<string, number>();
  return raw.map(h => {
    const base = h || 'colonne';
    const count = (seen.get(base) ?? 0) + 1;
    seen.set(base, count);
    return count === 1 ? base : `${base}_${count}`;
  });
}

@Injectable({ providedIn: 'root' })
export class CsvParserService {
  parsePreview(file: File): Promise<CsvPreview> {
    return new Promise((resolve, reject) => {
      Papa.parse<string[]>(file, {
        preview: 6,
        skipEmptyLines: true,
        encoding: 'UTF-8',
        delimiter: '',
        complete: results => {
          const data = results.data;
          if (!data.length) { reject(new Error('Fichier vide ou illisible')); return; }

          const rawHeaders = data[0] ?? [];
          const headers = deduplicateHeaders(rawHeaders);
          const preview = data.slice(1);

          const separator = (results.meta.delimiter as string) || ',';
          const previewChars = data.map(r => r.join(separator).length + 1).reduce((a, b) => a + b, 1);
          const estimatedRows = previewChars > 0
            ? Math.max(1, Math.round((file.size / previewChars) * (data.length - 1)) - 1)
            : Math.round(file.size / 80);

          resolve({ headers, preview, separator, estimatedRows });
        },
        error: err => reject(new Error(err.message)),
      });
    });
  }

  parseFullFile(file: File, separator: string): Promise<string[][]> {
    return new Promise((resolve, reject) => {
      Papa.parse<string[]>(file, {
        delimiter: separator,
        skipEmptyLines: true,
        encoding: 'UTF-8',
        complete: results => {
          resolve(results.data.slice(1));
        },
        error: err => reject(new Error(err.message)),
      });
    });
  }

  parse(content: string, separator = ','): { headers: string[]; rows: Record<string, string>[] } {
    const lines = content.trim().split('\n').filter(l => l.trim());
    if (lines.length < 2) return { headers: [], rows: [] };
    const headers = lines[0].split(separator).map(v => v.trim().replace(/^"|"$/g, ''));
    const rows = lines.slice(1).map(line => {
      const values = line.split(separator).map(v => v.trim().replace(/^"|"$/g, ''));
      return Object.fromEntries(headers.map((h, i) => [h, values[i] ?? '']));
    });
    return { headers, rows };
  }
}
