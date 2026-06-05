import { Injectable, inject } from '@angular/core';
import { Observable, from, switchMap, map, catchError, throwError } from 'rxjs';
import { ImportStats } from '../../models/import.model';
import { ImageApi } from '../../api/image.api';
import { readZipEntries } from '../../utils/zip-reader';
import { BaseImportService } from './base-import.service';

/** One product image extracted from the uploaded ZIP archive. */
interface Import4Row {
  reference: string;
  filename: string;
  blob: Blob;
}

interface ZipParseResult {
  rows: Import4Row[];
  errors: { row: number; error: string }[];
}

// Image file name = "<product reference>.<ext>" (jpg / jpeg / png).
const IMAGE_NAME = /^(.+)\.(jpe?g|png)$/i;

/**
 * Import 4 — uploads product images from a ZIP archive.
 *
 * Each image in the archive must be named after the product reference
 * (`<reference>.jpg|jpeg|png`). The file is matched to its product by
 * reference and posted to PrestaShop as a product image.
 */
@Injectable({ providedIn: 'root' })
export class ProductImageImportService extends BaseImportService<Import4Row> {
  private readonly imageApi = inject(ImageApi);

  // ── Entry point ───────────────────────────────────────────────────────────

  importFile(file: File): Observable<ImportStats> {
    return from(this.parseZip(file)).pipe(
      switchMap(({ rows, errors }) =>
        this.run(rows).pipe(map((stats) => this.mergeParseErrors(stats, errors))),
      ),
    );
  }

  async validateFile(file: File): Promise<string[]> {
    try {
      const { errors } = await this.parseZip(file);
      return errors.map(e => `Ligne ${e.row}: ${e.error}`);
    } catch (e) {
      return [e instanceof Error ? e.message : 'Erreur inconnue'];
    }
  }

  // ── Row handler ───────────────────────────────────────────────────────────

  protected override importRow(row: Import4Row): Observable<void> {
    return this.resolveProduct(row.reference).pipe(
      switchMap((idProduct) =>
        this.imageApi.uploadProductImage(idProduct, row.blob, row.filename).pipe(map(() => void 0)),
      ),
      catchError((err: unknown) => {
        const msg = err instanceof Error ? err.message : String(err);
        return throwError(() => new Error(`${row.filename} — ${msg}`));
      }),
    );
  }

  // ── ZIP parsing ───────────────────────────────────────────────────────────

  private async parseZip(file: File): Promise<ZipParseResult> {
    const entries = await readZipEntries(file);
    const rows: Import4Row[] = [];
    const errors: { row: number; error: string }[] = [];
    let index = 1;

    for (const entry of entries) {
      const filename = entry.name.split('/').pop() ?? entry.name;
      if (!filename || filename.startsWith('.') || entry.name.includes('__MACOSX/')) continue;

      const match = IMAGE_NAME.exec(filename);
      if (!match) {
        errors.push({
          row: index++,
          error: `« ${filename} » ignoré — nom attendu : <reference>.jpg, .jpeg ou .png`,
        });
        continue;
      }

      const ext = match[2].toLowerCase();
      rows.push({
        reference: match[1].trim(),
        filename,
        blob: new Blob([entry.bytes], { type: ext === 'png' ? 'image/png' : 'image/jpeg' }),
      });
      index++;
    }

    if (!rows.length && !errors.length) {
      throw new Error("Aucune image trouvée dans l'archive ZIP.");
    }
    return { rows, errors };
  }
}
