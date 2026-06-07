import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { forkJoin, map, Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../../../environment';
import { Item, ItemType } from '@app/core/models';
import { ASSET_TYPES, assetType, AssetTypeConfig } from '@app/core/constants/glpi.constants';

interface GlpiItemRaw {
  id: number;
  name: string;
  states_id: string;
  locations_id: string;
  manufacturers_id: string;
  otherserial: string;
  contact: string;
  users_id_tech: string;
  // Model field name varies per asset type (computermodels_id, printermodels_id…).
  [key: string]: unknown;
}

@Injectable({ providedIn: 'root' })
export class ItemV1Service {
  private readonly http = inject(HttpClient);
  private readonly base = environment.glpi.v1ApiUrl;
  private readonly params = new HttpParams().set('expand_dropdowns', '1');

  getAll(): Observable<Item[]> {
    return forkJoin(
      ASSET_TYPES.map(cfg =>
        this.http.get<GlpiItemRaw[]>(`${this.base}/${cfg.itemtype}`, { params: this.params }).pipe(
          // A type with no rows can answer 4xx on some GLPI builds → treat as empty.
          catchError(() => of([] as GlpiItemRaw[])),
          map(raws => raws.map(raw => this.mapItem(raw, cfg))),
        )
      )
    ).pipe(map(lists => lists.flat()));
  }

  getById(id: number, type: ItemType): Observable<Item> {
    const cfg = assetType(type)!;
    return this.http.get<GlpiItemRaw>(`${this.base}/${cfg.itemtype}/${id}`, { params: this.params }).pipe(
      map(raw => this.mapItem(raw, cfg))
    );
  }

  create(data: Partial<Item>, type: ItemType): Observable<{ id: number }> {
    const cfg = assetType(type)!;
    return this.http.post<{ id: number }>(`${this.base}/${cfg.itemtype}`, { input: data });
  }

  update(id: number, data: Partial<Item>, type: ItemType): Observable<void> {
    const cfg = assetType(type)!;
    return this.http.put<void>(`${this.base}/${cfg.itemtype}/${id}`, { input: data });
  }

  delete(id: number, type: ItemType): Observable<void> {
    const cfg = assetType(type)!;
    return this.http.delete<void>(`${this.base}/${cfg.itemtype}/${id}`);
  }

  private mapItem(raw: GlpiItemRaw, cfg: AssetTypeConfig): Item {
    return {
      id: raw.id,
      name: raw.name,
      status: raw.states_id,
      location: raw.locations_id,
      manufacturer: raw.manufacturers_id,
      item_type: cfg.itemtype,
      model: String((cfg.modelField ? raw[cfg.modelField] : undefined) ?? ''),
      inventory_number: raw.otherserial,
      // CSV "User" is stored in the asset's `contact` field at import time.
      user: raw.contact || raw.users_id_tech
    };
  }
}
