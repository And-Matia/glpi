import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { forkJoin, map, Observable } from 'rxjs';
import { environment } from '../../../../environment';
import {Item, ItemType} from '@app/core/models';

interface GlpiV2Item {
  id: number;
  name: string;
  inventory_number: string;
  status: { name: string };
  location: { name: string };
  manufacturer: { name: string };
  model: { name: string };
  user: { name: string };
}

@Injectable({ providedIn: 'root' })
export class ItemV2Service {
  private readonly http = inject(HttpClient);
  private readonly base = environment.glpi.v2ApiUrl;

  getAll(filter?: string): Observable<Item[]> {
    const params = filter ? new HttpParams().set('filter', filter) : undefined;
    return forkJoin([
      this.http.get<GlpiV2Item[]>(`${this.base}/Asset/Computer`, { params }),
      this.http.get<GlpiV2Item[]>(`${this.base}/Asset/Monitor`, { params })
    ]).pipe(
      map(([computers, monitors]) => [
        ...computers.map(c => this.mapItem(c, 'Computer')),
        ...monitors.map(m => this.mapItem(m, 'Monitor'))
      ])
    );
  }

  getById(id: number, type: ItemType): Observable<Item> {
    const endpoint = type === 'Computer' ? 'Asset/Computer' : 'Asset/Monitor';
    return this.http.get<GlpiV2Item>(`${this.base}/${endpoint}/${id}`).pipe(
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
      inventory_number: raw.inventory_number ?? '',
      user: raw.user?.name ?? ''
    };
  }
}
