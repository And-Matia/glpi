import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { environment } from '../../../../../../environment';
import { GlpiUser } from '@app/core/models/glpi/entities/user.model';

interface GlpiUserRawV2 {
  id: number;
  name: string;
  realname: string;
  firstname: string;
  phone: string;
  is_active: boolean;
  emails?: { email: string }[];
}

@Injectable({ providedIn: 'root' })
export class UserV2Service {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.glpi.v2ApiUrl}/Administration/User`;

  getAll(): Observable<GlpiUser[]> {
    return this.http.get<GlpiUserRawV2[]>(this.base).pipe(
      map(raws => raws.map(r => this.map(r))),
    );
  }

  getById(id: number): Observable<GlpiUser> {
    return this.http.get<GlpiUserRawV2>(`${this.base}/${id}`).pipe(
      map(r => this.map(r)),
    );
  }

  create(data: Partial<GlpiUser>): Observable<{ id: number }> {
    return this.http.post<{ id: number }>(this.base, data);
  }

  update(id: number, data: Partial<GlpiUser>): Observable<void> {
    return this.http.put<void>(`${this.base}/${id}`, data);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }

  private map(r: GlpiUserRawV2): GlpiUser {
    return {
      id:        r.id,
      name:      r.name,
      realname:  r.realname,
      firstname: r.firstname,
      email:     r.emails?.[0]?.email ?? '',
      phone:     r.phone,
      is_active: r.is_active,
    };
  }
}
