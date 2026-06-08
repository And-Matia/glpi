import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { environment } from '../../../../../../environment';
import { GlpiUser } from '@app/core/models/glpi/entities/user.model';

interface GlpiUserRaw {
  id: number;
  name: string;
  realname: string;
  firstname: string;
  phone: string;
  is_active: number;
  useremail?: { email?: string }[];
}

@Injectable({ providedIn: 'root' })
export class UserV1Service {
  private readonly http   = inject(HttpClient);
  private readonly base   = `${environment.glpi.v1ApiUrl}/User`;
  private readonly params = new HttpParams().set('expand_dropdowns', '1');

  getAll(): Observable<GlpiUser[]> {
    return this.http.get<GlpiUserRaw[]>(this.base, { params: this.params }).pipe(
      map(raws => raws.map(r => this.map(r))),
    );
  }

  getById(id: number): Observable<GlpiUser> {
    return this.http.get<GlpiUserRaw>(`${this.base}/${id}`, { params: this.params }).pipe(
      map(r => this.map(r)),
    );
  }

  create(data: Partial<GlpiUser>): Observable<{ id: number }> {
    return this.http.post<{ id: number }>(this.base, { input: data });
  }

  update(id: number, data: Partial<GlpiUser>): Observable<void> {
    return this.http.put<void>(`${this.base}/${id}`, { input: data });
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }

  private map(r: GlpiUserRaw): GlpiUser {
    return {
      id:        r.id,
      name:      r.name,
      realname:  r.realname,
      firstname: r.firstname,
      email:     r.useremail?.[0]?.email ?? '',
      phone:     r.phone,
      is_active: r.is_active === 1,
    };
  }
}
