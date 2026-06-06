import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { map, Observable, of, switchMap } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../../environment';

interface GlpiDropdownRaw {
  id: number;
  name: string;
}

/**
 * Resolves a GLPI dropdown value (Location, Manufacturer, State, models…) to
 * its numeric id, creating the entry if it does not exist yet ("find or create").
 * Results are cached so repeated values across rows hit GLPI only once.
 *
 * Callers MUST drive resolutions sequentially (e.g. one CSV row at a time via
 * `concatMap`) so the cache is populated before a duplicate value is requested.
 */
@Injectable({ providedIn: 'root' })
export class GlpiDropdownService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.glpi.v1ApiUrl;
  private readonly cache = new Map<string, number>();

  /** Returns the dropdown id for `name`, or 0 when `name` is empty. */
  resolve(itemtype: string, name: string): Observable<number> {
    const clean = (name ?? '').trim();
    if (!clean) return of(0);

    const key = `${itemtype}::${clean.toLowerCase()}`;
    const cached = this.cache.get(key);
    if (cached !== undefined) return of(cached);

    const params = new HttpParams().set('searchText[name]', clean).set('range', '0-99');

    return this.http.get<GlpiDropdownRaw[]>(`${this.base}/${itemtype}`, { params }).pipe(
      // An empty result set can surface as 4xx on some GLPI builds → treat as "not found".
      catchError(() => of([] as GlpiDropdownRaw[])),
      switchMap(list => {
        const found = (list ?? []).find(x => (x.name ?? '').trim().toLowerCase() === clean.toLowerCase());
        if (found) {
          this.cache.set(key, found.id);
          return of(found.id);
        }
        return this.http
          .post<{ id: number }>(`${this.base}/${itemtype}`, { input: { name: clean } })
          .pipe(map(res => {
            this.cache.set(key, res.id);
            return res.id;
          }));
      }),
    );
  }

  clearCache(): void {
    this.cache.clear();
  }
}
