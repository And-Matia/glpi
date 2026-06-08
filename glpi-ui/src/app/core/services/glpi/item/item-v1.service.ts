import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { forkJoin, map, Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../../../environment';
import { GlpiAsset } from '@app/core/models/glpi/assets/glpi-asset.model';
import { GlpiAssetRawV1, mapAssetRawV1 } from '../assets/base/base-asset-v1.service';
import { ASSET_TYPES, assetType } from '@app/core/models/glpi/assets/glpi-asset.model';
import { ItemType } from '@app/core/models/item.model';

@Injectable({ providedIn: 'root' })
export class ItemV1Service {
  private readonly http   = inject(HttpClient);
  private readonly base   = environment.glpi.v1ApiUrl;
  private readonly params = new HttpParams().set('expand_dropdowns', '1');

  getAll(): Observable<GlpiAsset[]> {
    return forkJoin(
      ASSET_TYPES.map(cfg =>
        this.http.get<GlpiAssetRawV1[]>(`${this.base}/${encodeURIComponent(cfg.apiType)}`, { params: this.params }).pipe(
          catchError(() => of([] as GlpiAssetRawV1[])),
          map(raws => raws.map(raw => mapAssetRawV1(raw, cfg))),
        )
      )
    ).pipe(map(lists => lists.flat()));
  }

  getById(id: number, type: ItemType): Observable<GlpiAsset> {
    const cfg = assetType(type)!;
    return this.http.get<GlpiAssetRawV1>(`${this.base}/${encodeURIComponent(cfg.apiType)}/${id}`, { params: this.params }).pipe(
      map(raw => mapAssetRawV1(raw, cfg))
    );
  }

  create(data: Partial<GlpiAsset>, type: ItemType): Observable<{ id: number }> {
    const cfg = assetType(type)!;
    return this.http.post<{ id: number }>(`${this.base}/${encodeURIComponent(cfg.apiType)}`, { input: data });
  }

  update(id: number, data: Partial<GlpiAsset>, type: ItemType): Observable<void> {
    const cfg = assetType(type)!;
    return this.http.put<void>(`${this.base}/${encodeURIComponent(cfg.apiType)}/${id}`, { input: data });
  }

  delete(id: number, type: ItemType): Observable<void> {
    const cfg = assetType(type)!;
    return this.http.delete<void>(`${this.base}/${encodeURIComponent(cfg.apiType)}/${id}`);
  }
}
