import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../environment';

interface DocumentItemRaw { documents_id: number; }

@Injectable({ providedIn: 'root' })
export class AssetImageService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.glpi.v1ApiUrl;

  async getImageUrl(itemId: number, apiType: string): Promise<string | null> {
    let docs: DocumentItemRaw[] = [];
    try {
      docs = await firstValueFrom(this.http.get<DocumentItemRaw[]>(`${this.base}/${apiType}/${itemId}/Document_Item/`));
    } catch {
      return null;
    }

    if (!docs?.length) return null;

    try {
      const blob = await firstValueFrom(this.http.get(`${this.base}/Document/${docs[0].documents_id}/download`, { responseType: 'blob' }));
      return URL.createObjectURL(blob);
    } catch {
      return null;
    }
  }
}
