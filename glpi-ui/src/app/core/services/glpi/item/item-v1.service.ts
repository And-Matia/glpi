import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { forkJoin, map, Observable } from 'rxjs';
import { environment } from '../../../../../environment';
import { Item, ItemType } from '@app/core/models';

interface GlpiItemRaw {
  id: number;
  name: string;
  states_id: string;
  locations_id: string;
  manufacturers_id: string;
  computermodels_id?: string;
  monitormodels_id?: string;
  otherserial: string;
  contact: string;
  users_id_tech: string;
}

@Injectable({ providedIn: 'root' })
export class ItemV1Service {
  private readonly http = inject(HttpClient);
  private readonly base = environment.glpi.v1ApiUrl;
  private readonly params = new HttpParams().set('expand_dropdowns', '1');

  getAll(): Observable<Item[]> {
    return forkJoin([
      this.http.get<GlpiItemRaw[]>(`${this.base}/Computer`, { params: this.params }),
      this.http.get<GlpiItemRaw[]>(`${this.base}/Monitor`, { params: this.params })
    ]).pipe(
      map(([computers, monitors]) => [
        ...computers.map(c => this.mapItem(c, 'Computer')),
        ...monitors.map(m => this.mapItem(m, 'Monitor'))
      ])
    );
  }

  getById(id: number, type: ItemType): Observable<Item> {
    const endpoint = type === 'Computer' ? 'Computer' : 'Monitor';
    return this.http.get<GlpiItemRaw>(`${this.base}/${endpoint}/${id}`, { params: this.params }).pipe(
      map(raw => this.mapItem(raw, type))
    );
  }

  create(data: Partial<Item>, type: ItemType): Observable<{ id: number }> {
    const endpoint = type === 'Computer' ? 'Computer' : 'Monitor';
    return this.http.post<{ id: number }>(`${this.base}/${endpoint}`, { input: data });
  }

  update(id: number, data: Partial<Item>, type: ItemType): Observable<void> {
    const endpoint = type === 'Computer' ? 'Computer' : 'Monitor';
    return this.http.put<void>(`${this.base}/${endpoint}/${id}`, { input: data });
  }

  delete(id: number, type: ItemType): Observable<void> {
    const endpoint = type === 'Computer' ? 'Computer' : 'Monitor';
    return this.http.delete<void>(`${this.base}/${endpoint}/${id}`);
  }

  private mapItem(raw: GlpiItemRaw, type: ItemType): Item {
    return {
      id: raw.id,
      name: raw.name,
      status: raw.states_id,
      location: raw.locations_id,
      manufacturer: raw.manufacturers_id,
      item_type: type,
      model: raw.computermodels_id ?? raw.monitormodels_id ?? '',
      inventory_number: raw.otherserial,
      // CSV "User" is stored in the asset's `contact` field at import time.
      user: raw.contact || raw.users_id_tech
    };
  }
}
