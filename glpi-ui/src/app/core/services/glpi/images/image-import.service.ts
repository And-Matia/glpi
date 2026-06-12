import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import JSZip from 'jszip';
import {GLPI_CONFIG} from '@app/core/config/glpi.config';
import { ImportStats, ItemType } from '@app/core/models';
import { GlpiLookupService } from '../../import/base/lookup.service';
import { apiTypeOf } from '@app/core/constants/asset.constants';
import { detectImageType} from '@app/core/utils/file-type.utils';

function itemNameFromPath(path: string): string {
  const file = path.split('/').pop() ?? path;
  return file.replace(/\.[^.]+$/, '');
}

@Injectable({ providedIn: 'root' })
export class ImageImportService {
  private readonly http   = inject(HttpClient);
  private readonly lookup = inject(GlpiLookupService);
  private readonly base   = GLPI_CONFIG.apiV1;

  async validateFile(file: File): Promise<string[]> {
    const arr = new Uint8Array(await file.slice(0, 4).arrayBuffer());
    if (arr[0] !== 0x50 || arr[1] !== 0x4b) {
      return ['Le fichier doit être une archive ZIP valide (signature PK manquante).'];
    }
    return [];
  }

  importFile(file: File): Promise<ImportStats> {
    return this.run(file);
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
        const kind = detectImageType(bytes);
        if (!kind) {
          throw new Error(`Format image non reconnu pour "${entry.name}".`);
        }

        const itemName = itemNameFromPath(entry.name);
        const target = await this.lookup.findItemByName(itemName);
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
