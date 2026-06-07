import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { defer, firstValueFrom, from, Observable } from 'rxjs';
import JSZip from 'jszip';
import { environment } from '../../../../environment';
import { ImportStats, ItemType } from '@app/core/models';
import { GlpiImportLookupService } from './glpi-import-lookup.service';
import { apiTypeOf } from '@app/core/constants/glpi.constants';

/** Maps real magic-byte content to a GLPI-accepted extension/mime. */
function detectImage(bytes: Uint8Array): { mime: string; ext: string } | null {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff)
    return { mime: 'image/jpeg', ext: 'jpg' };
  if (bytes.length >= 4 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47)
    return { mime: 'image/png', ext: 'png' };
  if (bytes.length >= 4 && bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x38)
    return { mime: 'image/gif', ext: 'gif' };
  if (bytes.length >= 2 && bytes[0] === 0x42 && bytes[1] === 0x4d)
    return { mime: 'image/bmp', ext: 'bmp' };
  return null;
}

/** "images/PC-ADM-001.png" → "PC-ADM-001" */
function itemNameFromPath(path: string): string {
  const file = path.split('/').pop() ?? path;
  return file.replace(/\.[^.]+$/, '');
}

@Injectable({ providedIn: 'root' })
export class ImageImportService {
  private readonly http   = inject(HttpClient);
  private readonly lookup = inject(GlpiImportLookupService);
  private readonly base   = environment.glpi.v1ApiUrl;

  async validateFile(file: File): Promise<string[]> {
    const arr = new Uint8Array(await file.slice(0, 4).arrayBuffer());
    // ZIP magic bytes: "PK" (0x50 0x4B)
    if (arr[0] !== 0x50 || arr[1] !== 0x4b) {
      return ['Le fichier doit être une archive ZIP valide (signature PK manquante).'];
    }
    return [];
  }

  importFile(file: File): Observable<ImportStats> {
    // `defer` so the work (unzip + item lookup + upload) only starts when this
    // step is actually reached in the import sequence — never eagerly, in
    // parallel with the items import, which would look up items before they exist.
    return defer(() => from(this.run(file)));
  }

  private async run(file: File): Promise<ImportStats> {
    const stats: ImportStats = { total: 0, success: 0, failed: 0, errors: [] };

    let zip: JSZip;
    try {
      zip = await JSZip.loadAsync(file);
    } catch {
      return { total: 1, success: 0, failed: 1, errors: [{ row: 1, error: "Archive ZIP illisible." }] };
    }

    // Real image entries only — skip directories and the macOS "__MACOSX" sidecars.
    const entries = Object.values(zip.files).filter(
      f => !f.dir && !f.name.split('/').some(seg => seg.startsWith('__MACOSX') || seg.startsWith('._')),
    );

    stats.total = entries.length;
    let line = 1;

    for (const entry of entries) {
      const row = line++;
      try {
        const bytes = await entry.async('uint8array');
        const kind = detectImage(bytes);
        if (!kind) {
          throw new Error(`Format image non reconnu pour "${entry.name}".`);
        }

        const itemName = itemNameFromPath(entry.name);
        const target = await firstValueFrom(this.lookup.findItemByName(itemName));
        if (!target) {
          throw new Error(`Aucun élément GLPI nommé "${itemName}".`);
        }

        // GLPI 11 validates content vs extension → name the upload by its real type.
        const uploadName = `${itemName}.${kind.ext}`;
        const docId = await this.uploadDocument(uploadName, bytes, kind.mime, itemName);
        await this.linkDocument(docId, target.type, target.id);

        stats.success++;
      } catch (e) {
        stats.failed++;
        stats.errors.push({ row, error: e instanceof Error ? e.message : String(e) });
      }
    }

    return stats;
  }

  private async uploadDocument(filename: string, bytes: Uint8Array, mime: string, docName: string): Promise<number> {
    const form = new FormData();
    form.append('uploadManifest', JSON.stringify({ input: { name: docName, _filename: [filename] } }));
    form.append('filename[0]', new Blob([bytes as BlobPart], { type: mime }), filename);

    const res = await firstValueFrom(this.http.post<{ id: number }>(`${this.base}/Document`, form));
    if (!res?.id) throw new Error(`Échec du téléversement de "${filename}".`);
    return res.id;
  }

  private async linkDocument(documentsId: number, itemtype: ItemType, itemsId: number): Promise<void> {
    await firstValueFrom(
      this.http.post(`${this.base}/Document_Item`, {
        input: { documents_id: documentsId, itemtype: apiTypeOf(itemtype), items_id: itemsId },
      }),
    );
  }
}
