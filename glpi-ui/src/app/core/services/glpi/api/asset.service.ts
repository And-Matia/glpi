import {inject, Injectable} from '@angular/core';
import {HttpClient, HttpParams} from '@angular/common/http';
import {firstValueFrom} from 'rxjs';
import {GLPI_CONFIG} from '@app/core/config/glpi.config';
import {GlpiAsset} from '@app/core/models/asset.model';
import {ASSET_TYPES, assetType} from '@app/core/constants/asset.constants';
import {ItemType} from '@app/core/models';

interface GlpiAssetRawV2 {
  id: number;
  name: string;
  otherserial: string | null;
  contact: string | null;
  status: { name: string } | null;
  location: { name: string } | null;
  manufacturer: { name: string } | null;
  model: { name: string } | null;
  user: { name: string } | null;
}

@Injectable({providedIn: 'root'})
export class AssetService {
  private readonly http = inject(HttpClient);
  private readonly baseV1 = GLPI_CONFIG.apiV1;
  private readonly baseV2 = GLPI_CONFIG.apiV2;

  getAll(filter?: string): Promise<GlpiAsset[]> {
    return this.fetch(false, filter);
  }

  getTrash(): Promise<GlpiAsset[]> {
    return this.fetch(true);
  }

  private async fetch(deleted: boolean, filter?: string): Promise<GlpiAsset[]> {
    let params = new HttpParams().set('filter[is_deleted]', deleted ? '1' : '0');
    if (filter) params = params.set('filter', filter);
    const results = await Promise.all(
      ASSET_TYPES.map(async cfg => {
        try {
          const raws = await firstValueFrom(this.http.get<GlpiAssetRawV2[]>(`${this.baseV2}/${cfg.v2Path}`, {params}));
          return raws.map(r => this.mapV2(r, cfg.itemtype));
        } catch {
          return [];
        }
      })
    );
    return results.flat();
  }

  async getById(id: number, type: ItemType): Promise<GlpiAsset> {
    const cfg = assetType(type)!;
    const raw = await firstValueFrom(this.http.get<GlpiAssetRawV2>(`${this.baseV2}/${cfg.v2Path}/${id}`));
    return this.mapV2(raw, type);
  }

  create(data: Partial<GlpiAsset>, type: ItemType): Promise<{ id: number }> {
    const cfg = assetType(type)!;
    return firstValueFrom(this.http.post<{
      id: number
    }>(`${this.baseV1}/${encodeURIComponent(cfg.apiType)}`, {input: data}));
  }

  update(id: number, data: Partial<GlpiAsset>, type: ItemType): Promise<void> {
    const cfg = assetType(type)!;
    return firstValueFrom(this.http.put<void>(`${this.baseV1}/${encodeURIComponent(cfg.apiType)}/${id}`, {input: data}));
  }

  delete(id: number, type: ItemType): Promise<void> {
    const cfg = assetType(type)!;
    return firstValueFrom(this.http.delete<void>(`${this.baseV1}/${encodeURIComponent(cfg.apiType)}/${id}`));
  }

  private mapV2(raw: GlpiAssetRawV2, type: ItemType): GlpiAsset {
    return {
      id: raw.id,
      name: raw.name,
      item_type: type,
      status: raw.status?.name ?? '',
      location: raw.location?.name ?? '',
      manufacturer: raw.manufacturer?.name ?? '',
      model: raw.model?.name ?? '',
      inventory_number: raw.otherserial ?? '',
      user: String(raw.contact || raw.user?.name || ''),
    };
  }
}
