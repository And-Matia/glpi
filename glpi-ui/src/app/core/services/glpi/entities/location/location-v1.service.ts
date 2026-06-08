import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../../environment';
import { GlpiLocation } from '@app/core/models/glpi/entities/location.model';

@Injectable({ providedIn: 'root' })
export class LocationV1Service {
  private readonly http   = inject(HttpClient);
  private readonly base   = `${environment.glpi.v1ApiUrl}/Location`;
  private readonly params = new HttpParams().set('expand_dropdowns', '1');

  getAll(): Observable<GlpiLocation[]> {
    return this.http.get<GlpiLocation[]>(this.base, { params: this.params });
  }

  getById(id: number): Observable<GlpiLocation> {
    return this.http.get<GlpiLocation>(`${this.base}/${id}`, { params: this.params });
  }

  create(data: Partial<GlpiLocation>): Observable<{ id: number }> {
    return this.http.post<{ id: number }>(this.base, { input: data });
  }

  update(id: number, data: Partial<GlpiLocation>): Observable<void> {
    return this.http.put<void>(`${this.base}/${id}`, { input: data });
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
