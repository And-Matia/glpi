import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { catchError, concatMap, first, from, map, Observable, of } from 'rxjs';
import { environment } from '../../../../environment';
import { ItemType } from '@app/core/models';
import { ASSET_TYPES } from '@app/core/constants/glpi.constants';

interface GlpiNamed { id: number; name: string; }
interface GlpiTicket { id: number; externalid: string | null; }

/**
 * Resolves CSV references to the GLPI ids they map to, by querying GLPI directly
 * (the source of truth) — no client-side registry / localStorage involved.
 *
 *   - items   : unique asset `name`        → { id, type }
 *   - tickets : CSV ref stored in `externalid` → ticket id
 *
 * `searchText` does a "contains" match, so every result is filtered for an exact
 * (case-insensitive) match before being accepted.
 */
@Injectable({ providedIn: 'root' })
export class GlpiImportLookupService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.glpi.v1ApiUrl;

  /** Finds an asset by its (unique) name across every supported itemtype. */
  findItemByName(name: string): Observable<{ id: number; type: ItemType } | null> {
    const clean = (name ?? '').trim();
    if (!clean) return of(null);

    return from(ASSET_TYPES).pipe(
      // Sequential: stop at the first itemtype that yields an exact-name match.
      concatMap(cfg => {
        const params = new HttpParams().set('searchText[name]', clean).set('range', '0-99');
        return this.http
          .get<GlpiNamed[]>(`${this.base}/${encodeURIComponent(cfg.apiType)}`, { params })
          .pipe(
            catchError(() => of([] as GlpiNamed[])),
            map(list => {
              const found = (list ?? []).find(
                x => (x.name ?? '').trim().toLowerCase() === clean.toLowerCase(),
              );
              return found ? { id: found.id, type: cfg.itemtype } : null;
            }),
          );
      }),
      first((r): r is { id: number; type: ItemType } => r !== null, null),
    );
  }

  /** Finds a ticket id from the CSV reference stored in its `externalid` field. */
  findTicketIdByRef(ref: number | string): Observable<number | null> {
    const clean = String(ref ?? '').trim();
    if (!clean) return of(null);

    const params = new HttpParams().set('searchText[externalid]', clean).set('range', '0-99');
    return this.http.get<GlpiTicket[]>(`${this.base}/Ticket`, { params }).pipe(
      catchError(() => of([] as GlpiTicket[])),
      map(list => {
        const found = (list ?? []).find(t => String(t.externalid ?? '').trim() === clean);
        return found ? found.id : null;
      }),
    );
  }
}
