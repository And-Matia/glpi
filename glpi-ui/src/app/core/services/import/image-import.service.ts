import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { defer, firstValueFrom, from, Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import JSZip from 'jszip';
import { environment } from '../../../../environment';
import { ImportStats, ItemType } from '@app/core/models';
import { ImportRegistryService } from './import-registry.service';
import { ASSET_TYPES, assetType } from '@app/core/constants/glpi.constants';
import { detectImageType, isZip, readHeaderBytes } from '@app/core/utils/file-type.utils';

interface GlpiNamed { id: number; name: string; }

/** "images/PC-ADM-001.png" → "PC-ADM-001" */
function itemNameFromPath(path: string): string {
  const file = path.split('/').pop() ?? path;
  return file.replace(/\.[^.]+$/, '');
}

@Injectable({ providedIn: 'root' })
export class ImageImportService {
  private readonly http     = inject(HttpClient);
  private readonly registry = inject(ImportRegistryService);
  private readonly base     = environment.glpi.v1ApiUrl;  // Document upload + linking
  private readonly v2base   = environment.glpi.v2ApiUrl;  // asset lookup by name

  async validateFile(file: File): Promise<string[]> {
    const header = await readHeaderBytes(file, 4);
    if (!isZip(header)) {
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
        const target = await this.findItem(itemName);
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

  /** Resolves an item by name: registry first (same import run), then GLPI lookup.
   *  Lookup uses the v2 `Assets/{itemtype}` path so every type is reachable by its
   *  plain name — including namespaced classes (e.g. Socket) that v1 can't address. */
  private async findItem(name: string): Promise<{ id: number; type: ItemType } | null> {
    const cached = this.registry.getItem(name);
    if (cached) return { id: cached.id, type: cached.item_type };

    for (const cfg of ASSET_TYPES) {
      const params = new HttpParams().set('filter', `name==${name}`);
      const list = await firstValueFrom(
        this.http.get<GlpiNamed[]>(`${this.v2base}/${cfg.v2Path}`, { params }).pipe(catchError(() => of([] as GlpiNamed[]))),
      );
      const found = (list ?? []).find(x => (x.name ?? '').trim().toLowerCase() === name.toLowerCase());
      if (found) return { id: found.id, type: cfg.itemtype };
    }
    return null;
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
    // Document_Item stores the GLPI class name; namespaced types (Socket) differ from itemtype.
    const relationType = assetType(itemtype)?.relationType ?? itemtype;
    await firstValueFrom(
      this.http.post(`${this.base}/Document_Item`, {
        input: { documents_id: documentsId, itemtype: relationType, items_id: itemsId },
      }),
    );
  }
}
