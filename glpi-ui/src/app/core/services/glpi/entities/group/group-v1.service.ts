import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { environment } from '../../../../../../environment';
import { GlpiGroup } from '@app/core/models/glpi/entities/group.model';

interface GlpiGroupRaw {
  id: number;
  name: string;
  comment: string;
  is_requester: number;
  is_assign: number;
  is_notify: number;
}

@Injectable({ providedIn: 'root' })
export class GroupV1Service {
  private readonly http   = inject(HttpClient);
  private readonly base   = `${environment.glpi.v1ApiUrl}/Group`;
  private readonly params = new HttpParams().set('expand_dropdowns', '1');

  getAll(): Observable<GlpiGroup[]> {
    return this.http.get<GlpiGroupRaw[]>(this.base, { params: this.params }).pipe(
      map(raws => raws.map(r => this.map(r))),
    );
  }

  getById(id: number): Observable<GlpiGroup> {
    return this.http.get<GlpiGroupRaw>(`${this.base}/${id}`, { params: this.params }).pipe(
      map(r => this.map(r)),
    );
  }

  create(data: Partial<GlpiGroup>): Observable<{ id: number }> {
    return this.http.post<{ id: number }>(this.base, { input: data });
  }

  update(id: number, data: Partial<GlpiGroup>): Observable<void> {
    return this.http.put<void>(`${this.base}/${id}`, { input: data });
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }

  private map(r: GlpiGroupRaw): GlpiGroup {
    return {
      id:           r.id,
      name:         r.name,
      comment:      r.comment,
      is_requester: r.is_requester === 1,
      is_assign:    r.is_assign    === 1,
      is_notify:    r.is_notify    === 1,
    };
  }
}
