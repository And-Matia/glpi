import {inject, Injectable} from '@angular/core';
import {HttpClient, HttpParams} from '@angular/common/http';
import {firstValueFrom, map, Observable} from 'rxjs';
import {environment} from '../../../../../../environment';
import {GlpiUser} from '@app/core/models/glpi/entities/user.model';

interface GlpiUserRaw {
  id: number;
  name: string;
  realname: string;
  firstname: string;
  phone: string;
  is_active: number;
  useremail?: { email?: string }[];
}

@Injectable({providedIn: 'root'})
export class UserV1Service {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.glpi.v1ApiUrl}/User`;
  private readonly params = new HttpParams().set('expand_dropdowns', '1');
  private readonly cache = new Map<string, number>();

  getAll(): Observable<GlpiUser[]> {
    return this.http.get<GlpiUserRaw[]>(this.base, {params: this.params}).pipe(
      map(raws => raws.map(r => this.map(r))),
    );
  }

  getById(id: number): Observable<GlpiUser> {
    return this.http.get<GlpiUserRaw>(`${this.base}/${id}`, {params: this.params}).pipe(
      map(r => this.map(r)),
    );
  }

  create(data: Partial<GlpiUser>): Observable<{ id: number }> {
    return this.http.post<{ id: number }>(this.base, {input: data});
  }

  update(id: number, data: Partial<GlpiUser>): Observable<void> {
    return this.http.put<void>(`${this.base}/${id}`, {input: data});
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}/?force_purge=1`);
  }

  async resolve(user: string): Promise<number> {
    const clean = (user ?? '').trim();
    if (!clean) return 0;

    const key = clean.toLowerCase();
    if (this.cache.has(key)) return this.cache.get(key)!;

    let users: GlpiUser[] = [];
    try {
      users = await firstValueFrom(this.getAll());
    } catch { users = []; }

    const found = users.find(u => {
      const fullName = `${u.realname ?? ''} ${u.firstname ?? ''}`.trim();
      return [u.name, u.realname, u.firstname, fullName].some(v => (v ?? '').trim().toLowerCase() === key);
    });

    if (found) {
      this.cache.set(key, found.id);
      return found.id;
    }

    const response = await firstValueFrom(this.create({ name: clean, realname: clean, is_active: true }));
    this.cache.set(key, response.id);
    return response.id;
  }

  private map(r: GlpiUserRaw): GlpiUser {
    return {
      id: r.id,
      name: r.name,
      realname: r.realname,
      firstname: r.firstname,
      email: r.useremail?.[0]?.email ?? '',
      phone: r.phone,
      is_active: r.is_active === 1,
    };
  }
}
