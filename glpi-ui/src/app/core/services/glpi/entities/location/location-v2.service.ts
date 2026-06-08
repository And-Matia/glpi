import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../../environment';
import { GlpiLocation } from '@app/core/models/glpi/entities/location.model';

@Injectable({ providedIn: 'root' })
export class LocationV2Service {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.glpi.v2ApiUrl}/Administration/Location`;

  getAll(): Observable<GlpiLocation[]> {
    return this.http.get<GlpiLocation[]>(this.base);
  }

  getById(id: number): Observable<GlpiLocation> {
    return this.http.get<GlpiLocation>(`${this.base}/${id}`);
  }

  create(data: Partial<GlpiLocation>): Observable<{ id: number }> {
    return this.http.post<{ id: number }>(this.base, data);
  }

  update(id: number, data: Partial<GlpiLocation>): Observable<void> {
    return this.http.put<void>(`${this.base}/${id}`, data);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
