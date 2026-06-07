import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { forkJoin, map, Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../../../environment';
import { Item, ItemType } from '@app/core/models';
import { ASSET_TYPES, assetType } from '@app/core/constants/glpi.constants';

interface GlpiV2Item {
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

@Injectable({ providedIn: 'root' })
export class ItemV2Service {
  private readonly http = inject(HttpClient);
  private readonly base = environment.glpi.v2ApiUrl;

  getAll(filter?: string): Observable<Item[]> {
    const params = filter ? new HttpParams().set('filter', filter) : undefined;
    return forkJoin(
      ASSET_TYPES.map(cfg =>
        this.http.get<GlpiV2Item[]>(`${this.base}/${cfg.v2Path}`, { params }).pipe(
          catchError(() => of([] as GlpiV2Item[])),
          map(items => items.map(i => this.mapItem(i, cfg.itemtype))),
        )
      )
    ).pipe(map(lists => lists.flat()));
  }

  getById(id: number, type: ItemType): Observable<Item> {
    const cfg = assetType(type)!;
    return this.http.get<GlpiV2Item>(`${this.base}/${cfg.v2Path}/${id}`).pipe(
      map(raw => this.mapItem(raw, type))
    );
  }

  private mapItem(raw: GlpiV2Item, type: ItemType): Item {
    return {
      id: raw.id,
      name: raw.name,
      status: raw.status?.name ?? '',
      location: raw.location?.name ?? '',
      manufacturer: raw.manufacturer?.name ?? '',
      item_type: type,
      model: raw.model?.name ?? '',
      inventory_number: raw.otherserial ?? '',
      // CSV "User" is imported into the asset's `contact` field; fall back to a linked GLPI user.
      // Coerce to string: GLPI may return `contact` as a non-string (e.g. a numeric value).
      user: String(raw.contact || raw.user?.name || '')
    };
  }
}
