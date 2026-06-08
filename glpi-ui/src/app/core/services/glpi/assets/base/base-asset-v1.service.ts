import { inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { map, Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../../../../environment';
import { GlpiAsset } from '@app/core/models/glpi/assets/glpi-asset.model';
import { AssetTypeConfig } from '@app/core/models/glpi/assets/glpi-asset.model';

export interface GlpiAssetRawV1 {
  id: number;
  name: string;
  states_id: string;
  locations_id: string;
  manufacturers_id: string;
  otherserial: string;
  contact: string;
  users_id_tech: string;
  [key: string]: unknown;
}

export abstract class BaseAssetV1Service<T extends GlpiAsset> {
  protected readonly http     = inject(HttpClient);
  protected readonly base     = environment.glpi.v1ApiUrl;
  protected readonly params   = new HttpParams().set('expand_dropdowns', '1');

  abstract readonly config: AssetTypeConfig;

  getAll(): Observable<T[]> {
    return this.http
      .get<GlpiAssetRawV1[]>(`${this.base}/${encodeURIComponent(this.config.apiType)}`, { params: this.params })
      .pipe(
        catchError(() => of([] as GlpiAssetRawV1[])),
        map(raws => raws.map(r => this.map(r))),
      );
  }

  getById(id: number): Observable<T> {
    return this.http
      .get<GlpiAssetRawV1>(`${this.base}/${encodeURIComponent(this.config.apiType)}/${id}`, { params: this.params })
      .pipe(map(r => this.map(r)));
  }

  create(data: Partial<T>): Observable<{ id: number }> {
    return this.http.post<{ id: number }>(
      `${this.base}/${encodeURIComponent(this.config.apiType)}`,
      { input: data },
    );
  }

  update(id: number, data: Partial<T>): Observable<void> {
    return this.http.put<void>(
      `${this.base}/${encodeURIComponent(this.config.apiType)}/${id}`,
      { input: data },
    );
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${encodeURIComponent(this.config.apiType)}/${id}`);
  }

  protected map(raw: GlpiAssetRawV1): T {
    return mapAssetRawV1(raw, this.config) as T;
  }
}

export function mapAssetRawV1(raw: GlpiAssetRawV1, cfg: AssetTypeConfig): GlpiAsset {
  return {
    id:               raw.id,
    name:             raw.name,
    item_type:        cfg.itemtype,
    status:           raw.states_id,
    location:         raw.locations_id,
    manufacturer:     raw.manufacturers_id,
    model:            cfg.modelField ? String(raw[cfg.modelField] ?? '') : '',
    inventory_number: raw.otherserial,
    user:             raw.contact || String(raw.users_id_tech ?? ''),
  };
}
