import {inject, Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {firstValueFrom} from 'rxjs';
import {GlpiLookupService} from '../base/lookup.service';
import {TICKET_TYPE_CODE, TICKET_STATUS_CODE, TICKET_PRIORITY_CODE} from '@app/core/constants/assistance.constants';
import {apiTypeOf} from '@app/core/constants/asset.constants';
import {parseCsvText, ParseResult} from '@app/core/utils/csv.utils';
import {GlpiBaseImportService} from '../base/glpi-base-import.service';
import {toGlpiDate} from '@app/core/utils/date.utils';
import {GLPI_CONFIG} from '@app/core/config/glpi.config';

interface TicketRow {
  ref_ticket:  string;
  date:        string; // "03/06/2026" or "2026-06-03"
  heure:       string; // "13:45"
  date_solve?: string; // optional — falls back to date
  date_close?: string; // optional — falls back to date
  type:        number;
  titre:       string;
  description: string;
  status:      number;
  priority:    number;
  items:       string[];
}

@Injectable({providedIn: 'root'})
export class TicketImportService extends GlpiBaseImportService<TicketRow> {
  private readonly http       = inject(HttpClient);
  private readonly lookup     = inject(GlpiLookupService);
  private readonly base       = GLPI_CONFIG.apiV1;
  private readonly itemTicket = `${GLPI_CONFIG.apiV1}/Item_Ticket`;

  protected async importRow(row: TicketRow): Promise<void> {
    const isClosed = row.status === 6;
    const isSolved = row.status === 5;

    const glpiDate       = toGlpiDate(row.date, row.heure);
    const glpiSolveDate  = row.date_solve ? toGlpiDate(row.date_solve, row.heure) : glpiDate;
    const glpiCloseDate  = row.date_close ? toGlpiDate(row.date_close, row.heure) : glpiDate;

    const {id: ticketId} = await firstValueFrom(
      this.http.post<{ id: number }>(`${this.base}/Ticket`, {
        input: {
          name:       row.titre,
          content:    row.description,
          type:       row.type,
          status:     isClosed ? 1 : row.status,
          priority:   row.priority,
          date:       glpiDate,
          externalid: row.ref_ticket,
          ...(isSolved ? { solvedate: glpiSolveDate } : {}),
        },
      })
    );

    await Promise.all(
      [...new Set(row.items)].map(async name => {
        const found = await this.lookup.findItemByName(name);
        if (!found) return;
        await firstValueFrom(
          this.http.post<void>(this.itemTicket, {
            input: { tickets_id: ticketId, itemtype: apiTypeOf(found.type), items_id: found.id },
          })
        );
      })
    );

    if (isClosed) {
      await firstValueFrom(
        this.http.put<void>(`${this.base}/Ticket/${ticketId}`, {
          input: { status: 6, solvedate: glpiSolveDate, closedate: glpiCloseDate },
        })
      );
    }
  }

  protected parseFile(file: File): Promise<ParseResult<TicketRow>> {
    return file.text().then(text =>
      parseCsvText<TicketRow>(text, record => {
        if (!record['titre']) throw new Error('Titre manquant');
        let items: string[] = [];
        const rawItems = record['items'] ?? '';
        if (rawItems) {
          try { items = JSON.parse(rawItems); } catch { items = []; }
        }
        return {
          ref_ticket:  (record['ref_ticket'] ?? '').trim(),
          date:        record['date']        ?? '',
          heure:       record['heure']       ?? '00:00',
          date_solve:  record['date_solve']  ?? '',
          date_close:  record['date_close']  ?? '',
          type:        TICKET_TYPE_CODE[record['type']     ?? ''] ?? 1,
          titre:       record['titre']       ?? '',
          description: record['description'] ?? '',
          status:      TICKET_STATUS_CODE[record['status']   ?? ''] ?? 1,
          priority:    TICKET_PRIORITY_CODE[record['priority'] ?? ''] ?? 3,
          items,
        };
      })
    );
  }
}
