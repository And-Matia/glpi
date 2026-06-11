import {inject, Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {firstValueFrom} from 'rxjs';
import {environment} from '../../../../environment';
import {GlpiLookupService} from './lookup.service';
import {TICKET_TYPE_CODE, TICKET_STATUS_CODE, TICKET_PRIORITY_CODE} from '@app/core/models/ticket.model';
import {apiTypeOf} from '@app/core/models/asset.model';
import {parseCsvText, ParseResult} from '@app/core/utils/csv.utils';
import {GlpiBaseImportService} from './glpi-base-import.service';

interface TicketRow {
  ref_ticket: string; // CSV reference, e.g. "TK-001" or "1" — kept as text
  date: string; // "03/06/2026"
  heure: string; // "13:45"
  type: number;
  titre: string;
  description: string;
  status: number;
  priority: number;
  items: string[]; // item names
}

function toGlpiDate(date: string, heure: string): string {
  const [day, month, year] = date.split('/');
  return `${year}-${(month ?? '').padStart(2, '0')}-${(day ?? '').padStart(2, '0')} ${heure}:00`;
}

@Injectable({providedIn: 'root'})
export class TicketImportService extends GlpiBaseImportService<TicketRow> {
  private readonly http = inject(HttpClient);
  private readonly lookup = inject(GlpiLookupService);
  private readonly base = environment.glpi.v1ApiUrl;
  private readonly itemTicket = `${environment.glpi.v1ApiUrl}/Item_Ticket`;

  protected async importRow(row: TicketRow): Promise<void> {

    const {id: ticketId} = await firstValueFrom(
      this.http.post<{ id: number }>(`${this.base}/Ticket`, {
        input: {
          name: row.titre,
          content: row.description,
          type: row.type,
          status: row.status === 6 ? 1 : row.status,
          priority: row.priority,
          date: toGlpiDate(row.date, row.heure),
          externalid: row.ref_ticket,
        },
      })
    );

    await Promise.all(
      row.items.map(async name => {
        const found = await this.lookup.findItemByName(name);

        if (!found) {
          return;
        }

        await firstValueFrom(
          this.http.post<void>(this.itemTicket, {
            input: {
              tickets_id: ticketId,
              itemtype: apiTypeOf(found.type),
              items_id: found.id,
            },
          })
        );
      })
    );


    if (row.status === 6) {
      await firstValueFrom(
        this.http.put<void>(`${this.base}/Ticket/${ticketId}`, {
          input: {
            status: 6,
          },
        })
      );
    }
  }

  protected parseFile(file: File): Promise<ParseResult<TicketRow>> {
    return file.text().then(text =>
      parseCsvText<TicketRow>(text, record => {
        if (!record['Titre']) throw new Error('Titre manquant');
        let items: string[] = [];
        const rawItems = record['Items'] ?? '';
        if (rawItems) {
          try {
            items = JSON.parse(rawItems);
          } catch {
            items = [];
          }
        }
        return {
          ref_ticket: (record['Ref_Ticket'] ?? '').trim(),
          date: record['Date'] ?? '',
          heure: record['Heure'] ?? '00:00',
          type: TICKET_TYPE_CODE[record['Type'] ?? ''] ?? 1,
          titre: record['Titre'] ?? '',
          description: record['Description'] ?? '',
          status: TICKET_STATUS_CODE[record['Status'] ?? ''] ?? 1,
          priority: TICKET_PRIORITY_CODE[record['Priority'] ?? ''] ?? 3,
          items,
        };
      })
    );
  }
}
