import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../environment';
import { GlpiLookupService } from './lookup.service';
import { parseCsvText, parseFrenchFloat, ParseResult } from '@app/core/utils/csv.utils';
import { GlpiBaseImportService } from './glpi-base-import.service';

interface TicketCostRow {
  num_ticket:      string; // CSV reference, e.g. "TK-001" or "1" — kept as text
  duration_second: number;
  time_cost:       number;
  fixed_cost:      number;
}

@Injectable({ providedIn: 'root' })
export class TicketCostImportService extends GlpiBaseImportService<TicketCostRow> {
  private readonly http   = inject(HttpClient);
  private readonly lookup = inject(GlpiLookupService);
  private readonly base   = environment.glpi.v1ApiUrl;

  protected async importRow(row: TicketCostRow): Promise<void> {
    const ticketId = await this.lookup.findTicketIdByRef(row.num_ticket);
    if (ticketId === null) {
      throw new Error(`Ticket #${row.num_ticket} introuvable : importez d'abord la feuille des tickets (feuille 2).`);
    }

    await firstValueFrom(
      this.http.post<void>(`${this.base}/TicketCost`, {
        input: {
          tickets_id:  ticketId,
          actiontime:  row.duration_second,
          cost_time:   row.time_cost,
          cost_fixed:  row.fixed_cost,
        },
      })
    );
  }

  protected parseFile(file: File): Promise<ParseResult<TicketCostRow>> {
    return file.text().then(text =>
      parseCsvText<TicketCostRow>(text, record => {
        if (!record['Num_Ticket']) throw new Error('Num_Ticket manquant');
        return {
          num_ticket:      (record['Num_Ticket'] ?? '').trim(),
          duration_second: Number(record['Duration_second']) || 0,
          time_cost:       parseFrenchFloat(record['Time_Cost']  ?? '0'),
          fixed_cost:      parseFrenchFloat(record['Fixed_Cost'] ?? '0'),
        };
      })
    );
  }
}
