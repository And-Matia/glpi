import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, concatMap, from, map, Observable, of } from 'rxjs';
import { environment } from '../../../environment';
import { ASSET_ITEMTYPES } from '@app/core/constants/glpi.constants';

// Suppression dans cet ordre pour respecter les contraintes de clés étrangères :
// liaisons d'abord, puis tickets/coûts, puis documents (images) et enfin les éléments
// (tous les types d'assets supportés).
const ENTITIES = ['TicketCost', 'Item_Ticket', 'Document_Item', 'Ticket', 'Document', ...ASSET_ITEMTYPES];

@Injectable({ providedIn: 'root' })
export class ResetService {
  private readonly http    = inject(HttpClient);
  private readonly baseUrl = environment.glpi.v1ApiUrl;

  resetAll(): Observable<void> {
    return from(ENTITIES).pipe(
      concatMap(entityType =>
        this.http.get<{ id: number }[]>(`${this.baseUrl}/${entityType}?range=0-9999`).pipe(
          map(items => items.map(i => i.id)),
          catchError(() => of([] as number[])),
          concatMap(ids => from(ids)),
          concatMap(id =>
            this.http.delete<void>(`${this.baseUrl}/${entityType}/${id}?force_purge=1`).pipe(
              catchError(() => of(undefined))
            )
          )
        )
      )
    );
  }
}
