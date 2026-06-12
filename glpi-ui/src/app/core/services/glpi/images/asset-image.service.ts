import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import {GLPI_CONFIG} from '@app/core/config/glpi.config';

interface DocumentItemRaw { documents_id: number; }

@Injectable({ providedIn: 'root' })
export class AssetImageService {
  private readonly http = inject(HttpClient);
  private readonly base = GLPI_CONFIG.apiV1;

  async getImageUrl(itemId: number, apiType: string): Promise<string | null> {
    console.log(`[AssetImageService] getImageUrl — itemId=${itemId} apiType=${apiType}`);
    let docs: DocumentItemRaw[] = [];
    try {
      docs = await firstValueFrom(this.http.get<DocumentItemRaw[]>(`${this.base}/${apiType}/${itemId}/Document_Item/`));
      console.log(`[AssetImageService] Document_Item response for ${apiType}/${itemId}:`, docs);
    } catch (err) {
      console.warn(`[AssetImageService] Document_Item fetch failed for ${apiType}/${itemId}:`, err);
      return null;
    }

    if (!docs?.length) {
      console.log(`[AssetImageService] No documents for ${apiType}/${itemId}`);
      return null;
    }

    const docId = docs[0].documents_id;
    console.log(`[AssetImageService] Downloading document id=${docId}`);
    try {
      const blob = await firstValueFrom(this.http.get(`${this.base}/Document/${docId}`, {
        responseType: 'blob',
        headers: { 'Accept': 'application/octet-stream' },
      }));
      console.log(`[AssetImageService] Blob received for doc ${docId}:`, blob.type, blob.size, 'bytes');
      const url = URL.createObjectURL(blob);
      console.log(`[AssetImageService] Object URL created:`, url);
      return url;
    } catch (err: any) {
      const body = err?.error instanceof Blob
        ? await err.error.text()
        : JSON.stringify(err?.error ?? err?.message ?? err);
      console.warn(`[AssetImageService] Blob download failed for doc ${docId} — status ${err?.status}:`, body);
      return null;
    }
  }
}
