import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { from, Observable, of } from 'rxjs';
import { catchError, concatMap, map, switchMap, toArray } from 'rxjs/operators';
import { environment } from '../../../../environment';
import { ImportStats } from '@app/core/models';
import { ImportRegistryService } from './import-registry.service';
import { TICKET_TYPE_CODE, TICKET_STATUS_CODE, TICKET_PRIORITY_CODE } from '@app/core/constants/glpi.constants';
import { parseCsvText, ParseResult } from '@app/core/utils/csv.utils';

interface TicketRow {
  ref_ticket:  number;
  date:        string; // "03/06/2026"
  heure:       string; // "13:45"
  type:        number;
  titre:       string;
  description: string;
  status:      number;
  priority:    number;
  items:       string[]; // item names
}

function toGlpiDate(date: string, heure: string): string {
  const [day, month, year] = date.split('/');
  return `${year}-${(month ?? '').padStart(2, '0')}-${(day ?? '').padStart(2, '0')} ${heure}:00`;
}

@Injectable({ providedIn: 'root' })
export class TicketImportService {
  private readonly http       = inject(HttpClient);
  private readonly registry   = inject(ImportRegistryService);
  private readonly base       = environment.glpi.v1ApiUrl;
  private readonly itemTicket = `${environment.glpi.v1ApiUrl}/Item_Ticket`;

  importFile(file: File): Observable<ImportStats> {
    return from(this.parseFile(file)).pipe(
      switchMap(({ rows, errors: parseErrors }) =>
        this.importRows(rows).pipe(
          map(stats => ({
            ...stats,
            total:  stats.total  + parseErrors.length,
            failed: stats.failed + parseErrors.length,
            errors: [...parseErrors, ...stats.errors],
          }))
        )
      )
    );
  }

  async validateFile(file: File): Promise<string[]> {
    try {
      const { errors } = await this.parseFile(file);
      return errors.map(e => `Ligne ${e.row}: ${e.error}`);
    } catch (e) {
      return [e instanceof Error ? e.message : 'Erreur inconnue'];
    }
  }

  private importRows(rows: TicketRow[]): Observable<ImportStats> {
    const stats: ImportStats = { total: rows.length, success: 0, failed: 0, errors: [] };
    if (!rows.length) return of(stats);

    return from(rows).pipe(
      concatMap((row, i) =>
        this.importRow(row).pipe(
          map(() => { stats.success++; return null; }),
          catchError(err => {
            stats.failed++;
            stats.errors.push({ row: i + 2, error: err instanceof Error ? err.message : String(err) });
            return of(null);
          })
        )
      ),
      toArray(),
      map(() => stats)
    );
  }

  private importRow(row: TicketRow): Observable<void> {
    // 1. Create ticket
    return this.http.post<{ id: number }>(`${this.base}/Ticket`, {
      input: {
        name:     row.titre,
        content:  row.description,
        type:     row.type,
        status:   row.status,
        priority: row.priority,
        date:     toGlpiDate(row.date, row.heure),
      },
    }).pipe(
      switchMap(({ id: ticketId }) => {
        // 2. Register ticket (csvRef → glpiId)
        this.registry.registerTicket(row.ref_ticket, ticketId);

        // 3. Link items sequentially
        const itemsToLink = row.items
          .map(name => this.registry.getItem(name))
          .filter((item): item is NonNullable<typeof item> => !!item);

        if (!itemsToLink.length) return of(void 0);

        return from(itemsToLink).pipe(
          concatMap(item =>
            this.http.post<void>(this.itemTicket, {
              input: { tickets_id: ticketId, itemtype: item.item_type, items_id: item.id },
            }).pipe(catchError(() => of(void 0)))
          ),
          toArray(),
          map(() => void 0)
        );
      })
    );
  }

  private parseFile(file: File): Promise<ParseResult<TicketRow>> {
    return file.text().then(text =>
      parseCsvText<TicketRow>(text, record => {
        if (!record['Titre']) throw new Error('Titre manquant');
        let items: string[] = [];
        const rawItems = record['Items'] ?? '';
        if (rawItems) {
          try { items = JSON.parse(rawItems); } catch { items = []; }
        }
        return {
          ref_ticket:  Number(record['Ref_Ticket']) || 0,
          date:        record['Date']        ?? '',
          heure:       record['Heure']       ?? '00:00',
          type:        TICKET_TYPE_CODE[record['Type']     ?? ''] ?? 1,
          titre:       record['Titre']       ?? '',
          description: record['Description'] ?? '',
          status:      TICKET_STATUS_CODE[record['Status']   ?? ''] ?? 1,
          priority:    TICKET_PRIORITY_CODE[record['Priority'] ?? ''] ?? 3,
          items,
        };
      })
    );
  }
}
