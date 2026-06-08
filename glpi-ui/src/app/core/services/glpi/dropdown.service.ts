import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../environment';

interface GlpiDropdownRaw {
  id: number;
  name: string;
}

// Resolves a GLPI dropdown value (Location, Manufacturer, State, models…) to
// its numeric id, creating the entry if it does not exist yet ("find or create").
// Results are cached so repeated calls for the same value don't hit the API again.
@Injectable({ providedIn: 'root' })
export class GlpiDropdownService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.glpi.v1ApiUrl;
  private readonly cache = new Map<string, number>();

  // Returns the dropdown id for `name`, or 0 when `name` is empty.
  async resolve(itemtype: string, name: string): Promise<number> {
    const clean = (name ?? '').trim();
    if (!clean) return 0;

    const key = `${itemtype}::${clean.toLowerCase()}`;
    if (this.cache.has(key)) return this.cache.get(key)!;

    // Encode for the URL path: namespaced dropdowns contain a backslash
    // (e.g. "Glpi\\SocketModel") that browsers would otherwise rewrite to "/".
    const path = encodeURIComponent(itemtype);
    const params = new HttpParams().set('searchText[name]', clean).set('range', '0-99');

    let list: GlpiDropdownRaw[] = [];
    try {
      // An empty result set can surface as 4xx on some GLPI builds → treat as "not found".
      list = await firstValueFrom(this.http.get<GlpiDropdownRaw[]>(`${this.base}/${path}`, { params }));
    } catch { list = []; }

    const found = list.find(x => (x.name ?? '').trim().toLowerCase() === clean.toLowerCase());
    if (found) {
      this.cache.set(key, found.id);
      return found.id;
    }

    const res = await firstValueFrom(this.http.post<{ id: number }>(`${this.base}/${path}`, { input: { name: clean } }));
    this.cache.set(key, res.id);
    return res.id;
  }

  clearCache(): void {
    this.cache.clear();
  }
}
