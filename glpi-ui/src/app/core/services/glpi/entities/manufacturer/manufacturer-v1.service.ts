import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../../environment';
import { GlpiManufacturer } from '@app/core/models/glpi/entities/manufacturer.model';

@Injectable({ providedIn: 'root' })
export class ManufacturerV1Service {
  private readonly http   = inject(HttpClient);
  private readonly base   = `${environment.glpi.v1ApiUrl}/Manufacturer`;
  private readonly params = new HttpParams().set('expand_dropdowns', '1');

  getAll(): Observable<GlpiManufacturer[]> {
    return this.http.get<GlpiManufacturer[]>(this.base, { params: this.params });
  }

  getById(id: number): Observable<GlpiManufacturer> {
    return this.http.get<GlpiManufacturer>(`${this.base}/${id}`, { params: this.params });
  }

  create(data: Partial<GlpiManufacturer>): Observable<{ id: number }> {
    return this.http.post<{ id: number }>(this.base, { input: data });
  }

  update(id: number, data: Partial<GlpiManufacturer>): Observable<void> {
    return this.http.put<void>(`${this.base}/${id}`, { input: data });
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
