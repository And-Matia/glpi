import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../environment';
import { ImportStats } from '@app/core/models';
import { GlpiLookupService } from './lookup.service';
import { TICKET_TYPE_CODE, TICKET_STATUS_CODE, TICKET_PRIORITY_CODE } from '@app/core/models/ticket.model';
import { apiTypeOf } from '@app/core/models/asset.model';
import { parseCsvText, ParseResult } from '@app/core/utils/csv.utils';

interface TicketRow {
  ref_ticket:  string; // CSV reference, e.g. "TK-001" or "1" — kept as text
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
  private readonly lookup     = inject(GlpiLookupService);
  private readonly base       = environment.glpi.v1ApiUrl;
  private readonly itemTicket = `${environment.glpi.v1ApiUrl}/Item_Ticket`;

  importFile(file: File): Promise<ImportStats> {
    return this.doImport(file);
  }

  async validateFile(file: File): Promise<string[]> {
    try {
      const { errors } = await this.parseFile(file);
      return errors.map(e => `Ligne ${e.row}: ${e.error}`);
    } catch (e) {
      return [e instanceof Error ? e.message : 'Erreur inconnue'];
    }
  }

  private async doImport(file: File): Promise<ImportStats> {
    const { rows, errors: parseErrors } = await this.parseFile(file);

    const stats: ImportStats = {
      total: rows.length + parseErrors.length,
      success: 0,
      failed: parseErrors.length,
      errors: [...parseErrors],
    };

    for (let i = 0; i < rows.length; i++) {
      try {
        await this.importRow(rows[i]);
        stats.success++;
      } catch (err) {
        stats.failed++;
        stats.errors.push({ row: i + 2, error: err instanceof Error ? err.message : String(err) });
      }
    }

    return stats;
  }

  private async importRow(row: TicketRow): Promise<void> {
    // 1. Create ticket — store the CSV reference in `externalid` so later imports
    //    (e.g. costs) can resolve this ticket by querying GLPI, with no registry.
    const { id: ticketId } = await firstValueFrom(
      this.http.post<{ id: number }>(`${this.base}/Ticket`, {
        input: {
          name:       row.titre,
          content:    row.description,
          type:       row.type,
          status:     row.status,
          priority:   row.priority,
          date:       toGlpiDate(row.date, row.heure),
          externalid: row.ref_ticket,
        },
      })
    );

    // 2. Link items: resolve each item by name in GLPI, then create the Item_Ticket relation.
    for (const name of row.items) {
      const found = await this.lookup.findItemByName(name);
      if (!found) continue;

      try {
        await firstValueFrom(
          this.http.post<void>(this.itemTicket, {
            input: { tickets_id: ticketId, itemtype: apiTypeOf(found.type), items_id: found.id },
          })
        );
      } catch { /* ignore individual link failures */ }
    }
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
          ref_ticket:  (record['Ref_Ticket'] ?? '').trim(),
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
