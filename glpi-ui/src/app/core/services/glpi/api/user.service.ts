import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import {GLPI_CONFIG} from '@app/core/config/glpi.config';
import { GlpiUser } from '@app/core/models';

interface GlpiUserRaw {
  id: number; name: string; realname: string; firstname: string;
  phone: string; is_active: number; useremail?: { email?: string }[];
}

@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly http   = inject(HttpClient);
  private readonly base   = `${GLPI_CONFIG.apiV1}/User`;
  private readonly params = new HttpParams().set('expand_dropdowns', '1');
  private readonly cache  = new Map<string, number>();

  async getAll(): Promise<GlpiUser[]> {
    const raws = await firstValueFrom(this.http.get<GlpiUserRaw[]>(this.base, { params: this.params }));
    return raws.map(r => this.map(r));
  }

  async getById(id: number): Promise<GlpiUser> {
    const raw = await firstValueFrom(this.http.get<GlpiUserRaw>(`${this.base}/${id}`, { params: this.params }));
    return this.map(raw);
  }

  create(data: Partial<GlpiUser>): Promise<{ id: number }> {
    return firstValueFrom(this.http.post<{ id: number }>(this.base, { input: data }));
  }

  update(id: number, data: Partial<GlpiUser>): Promise<void> {
    return firstValueFrom(this.http.put<void>(`${this.base}/${id}`, { input: data }));
  }

  delete(id: number): Promise<void> {
    return firstValueFrom(this.http.delete<void>(`${this.base}/${id}/?force_purge=1`));
  }

  async resolve(user: string): Promise<number> {
    const clean = (user ?? '').trim();
    if (!clean) return 0;
    const key = clean.toLowerCase();
    if (this.cache.has(key)) return this.cache.get(key)!;
    let users: GlpiUser[] = [];
    try { users = await this.getAll(); } catch { users = []; }
    const found = users.find(u => {
      const fullName = `${u.realname ?? ''} ${u.firstname ?? ''}`.trim();
      return [u.name, u.realname, u.firstname, fullName].some(v => (v ?? '').trim().toLowerCase() === key);
    });
    if (found) { this.cache.set(key, found.id); return found.id; }
    const response = await this.create({ name: clean, realname: clean, is_active: true });
    this.cache.set(key, response.id);
    return response.id;
  }

  private map(r: GlpiUserRaw): GlpiUser {
    return { id: r.id, name: r.name, realname: r.realname, firstname: r.firstname,
             email: r.useremail?.[0]?.email ?? '', phone: r.phone, is_active: r.is_active === 1 };
  }
}
