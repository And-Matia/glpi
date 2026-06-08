import { inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { map, Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../../../../environment';
import { GlpiAsset } from '@app/core/models/glpi/assets/glpi-asset.model';
import { AssetTypeConfig } from '@app/core/models/glpi/assets/glpi-asset.model';

export interface GlpiAssetRawV2 {
  id: number;
  name: string;
  otherserial: string | null;
  contact: string | null;
  status:       { name: string } | null;
  location:     { name: string } | null;
  manufacturer: { name: string } | null;
  model:        { name: string } | null;
  user:         { name: string } | null;
}

export abstract class BaseAssetV2Service<T extends GlpiAsset> {
  protected readonly http   = inject(HttpClient);
  protected readonly base   = environment.glpi.v2ApiUrl;

  abstract readonly config: AssetTypeConfig;

  getAll(filter?: string): Observable<T[]> {
    const params = filter ? new HttpParams().set('filter', filter) : undefined;
    return this.http
      .get<GlpiAssetRawV2[]>(`${this.base}/${this.config.v2Path}`, { params })
      .pipe(
        catchError(() => of([] as GlpiAssetRawV2[])),
        map(raws => raws.map(r => this.map(r))),
      );
  }

  getById(id: number): Observable<T> {
    return this.http
      .get<GlpiAssetRawV2>(`${this.base}/${this.config.v2Path}/${id}`)
      .pipe(map(r => this.map(r)));
  }

  create(data: Partial<T>): Observable<{ id: number }> {
    return this.http.post<{ id: number }>(`${this.base}/${this.config.v2Path}`, data);
  }

  update(id: number, data: Partial<T>): Observable<void> {
    return this.http.put<void>(`${this.base}/${this.config.v2Path}/${id}`, data);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${this.config.v2Path}/${id}`);
  }

  protected map(raw: GlpiAssetRawV2): T {
    return {
      id:               raw.id,
      name:             raw.name,
      item_type:        this.config.itemtype,
      status:           raw.status?.name ?? '',
      location:         raw.location?.name ?? '',
      manufacturer:     raw.manufacturer?.name ?? '',
      model:            raw.model?.name ?? '',
      inventory_number: raw.otherserial ?? '',
      user:             String(raw.contact || raw.user?.name || ''),
    } as T;
  }
}
