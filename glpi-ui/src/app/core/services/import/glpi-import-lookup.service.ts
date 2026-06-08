import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { catchError, concatMap, first, from, map, Observable, of } from 'rxjs';
import { environment } from '../../../../environment';
import { ItemType } from '@app/core/models/item.model';
import { ASSET_TYPES } from '@app/core/constants/glpi.constants';

interface GlpiNamed  { id: number; name: string; }
interface GlpiTicket { id: number; externalid: string | null; }

@Injectable({ providedIn: 'root' })
export class GlpiImportLookupService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.glpi.v1ApiUrl;

  findItemByName(name: string): Observable<{ id: number; type: ItemType } | null> {
    const clean = (name ?? '').trim();
    if (!clean) return of(null);

    return from(ASSET_TYPES).pipe(
      concatMap(cfg => {
        const params = new HttpParams().set('searchText[name]', clean).set('range', '0-99');
        return this.http
          .get<GlpiNamed[]>(`${this.base}/${encodeURIComponent(cfg.apiType)}`, { params })
          .pipe(
            catchError(() => of([] as GlpiNamed[])),
            map(list => {
              const found = (list ?? []).find(x => (x.name ?? '').trim().toLowerCase() === clean.toLowerCase());
              return found ? { id: found.id, type: cfg.itemtype as ItemType } : null;
            }),
          );
      }),
      first((r): r is { id: number; type: ItemType } => r !== null, null),
    );
  }

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
