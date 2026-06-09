import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { forkJoin, map, Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../../../environment';
import { GlpiAsset } from '@app/core/models/glpi/assets/glpi-asset.model';
import { GlpiAssetRawV2 } from '../assets/base/base-asset-v2.service';
import { ASSET_TYPES, assetType } from '@app/core/models/glpi/assets/glpi-asset.model';
import { ItemType } from '@app/core/models/item.model';

@Injectable({ providedIn: 'root' })
export class ItemV2Service {
  private readonly http = inject(HttpClient);
  private readonly base = environment.glpi.v2ApiUrl;

  getAll(filter?: string): Observable<GlpiAsset[]> {
    return this.fetch(false, filter);
  }

  getTrash(): Observable<GlpiAsset[]> {
    return this.fetch(true);
  }

  private fetch(deleted: boolean, filter?: string): Observable<GlpiAsset[]> {
    let params = new HttpParams().set('filter[is_deleted]', deleted ? '1' : '0');
    if (filter) params = params.set('filter', filter);
    return forkJoin(
      ASSET_TYPES.map(cfg =>
        this.http.get<GlpiAssetRawV2[]>(`${this.base}/${cfg.v2Path}`, { params }).pipe(
          catchError(() => of([] as GlpiAssetRawV2[])),
          map(raws => raws.map(raw => this.map(raw, cfg.itemtype))),
        )
      )
    ).pipe(map(lists => lists.flat()));
  }

  getById(id: number, type: ItemType): Observable<GlpiAsset> {
    const cfg = assetType(type)!;
    return this.http.get<GlpiAssetRawV2>(`${this.base}/${cfg.v2Path}/${id}`).pipe(
      map(raw => this.map(raw, type))
    );
  }

  private map(raw: GlpiAssetRawV2, type: ItemType): GlpiAsset {
    return {
      id:               raw.id,
      name:             raw.name,
      item_type:        type,
      status:           raw.status?.name ?? '',
      location:         raw.location?.name ?? '',
      manufacturer:     raw.manufacturer?.name ?? '',
      model:            raw.model?.name ?? '',
      inventory_number: raw.otherserial ?? '',
      user:             String(raw.contact || raw.user?.name || ''),
    };
  }
}
