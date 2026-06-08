import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../../environment';
import { GlpiState } from '@app/core/models/glpi/entities/state.model';

@Injectable({ providedIn: 'root' })
export class StateV1Service {
  private readonly http   = inject(HttpClient);
  private readonly base   = `${environment.glpi.v1ApiUrl}/State`;
  private readonly params = new HttpParams().set('expand_dropdowns', '1');

  getAll(): Observable<GlpiState[]> {
    return this.http.get<GlpiState[]>(this.base, { params: this.params });
  }

  getById(id: number): Observable<GlpiState> {
    return this.http.get<GlpiState>(`${this.base}/${id}`, { params: this.params });
  }

  create(data: Partial<GlpiState>): Observable<{ id: number }> {
    return this.http.post<{ id: number }>(this.base, { input: data });
  }

  update(id: number, data: Partial<GlpiState>): Observable<void> {
    return this.http.put<void>(`${this.base}/${id}`, { input: data });
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
