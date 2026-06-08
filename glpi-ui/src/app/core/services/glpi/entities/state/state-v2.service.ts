import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../../environment';
import { GlpiState } from '@app/core/models/glpi/entities/state.model';

@Injectable({ providedIn: 'root' })
export class StateV2Service {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.glpi.v2ApiUrl}/Administration/State`;

  getAll(): Observable<GlpiState[]> {
    return this.http.get<GlpiState[]>(this.base);
  }

  getById(id: number): Observable<GlpiState> {
    return this.http.get<GlpiState>(`${this.base}/${id}`);
  }

  create(data: Partial<GlpiState>): Observable<{ id: number }> {
    return this.http.post<{ id: number }>(this.base, data);
  }

  update(id: number, data: Partial<GlpiState>): Observable<void> {
    return this.http.put<void>(`${this.base}/${id}`, data);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
