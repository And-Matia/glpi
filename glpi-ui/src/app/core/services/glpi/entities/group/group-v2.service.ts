import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../../environment';
import { GlpiGroup } from '@app/core/models/glpi/entities/group.model';

@Injectable({ providedIn: 'root' })
export class GroupV2Service {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.glpi.v2ApiUrl}/Administration/Group`;

  getAll(): Observable<GlpiGroup[]> {
    return this.http.get<GlpiGroup[]>(this.base);
  }

  getById(id: number): Observable<GlpiGroup> {
    return this.http.get<GlpiGroup>(`${this.base}/${id}`);
  }

  create(data: Partial<GlpiGroup>): Observable<{ id: number }> {
    return this.http.post<{ id: number }>(this.base, data);
  }

  update(id: number, data: Partial<GlpiGroup>): Observable<void> {
    return this.http.put<void>(`${this.base}/${id}`, data);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
