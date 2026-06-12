import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import {GLPI_CONFIG} from '@app/core/config/glpi.config';
import { GlpiLookupService } from '../base/lookup.service';
import { parseCsvText, parseFrenchFloat, ParseResult } from '@app/core/utils/csv.utils';
import { GlpiBaseImportService } from '../base/glpi-base-import.service';

interface TicketCostRow {
  num_ticket:      string;
  name:            string;
  duration_second: number;
  time_cost:       number;
  fixed_cost:      number;
}

@Injectable({ providedIn: 'root' })
export class TicketCostImportService extends GlpiBaseImportService<TicketCostRow> {
  private readonly http   = inject(HttpClient);
  private readonly lookup = inject(GlpiLookupService);
  private readonly base   = GLPI_CONFIG.apiV1;

  protected async importRow(row: TicketCostRow): Promise<void> {
    const ticketId = await this.lookup.findTicketIdByRef(row.num_ticket);
    if (ticketId === null) {
      throw new Error(`Ticket #${row.num_ticket} introuvable : importez d'abord la feuille des tickets (feuille 2).`);
    }

    await firstValueFrom(
      this.http.post<void>(`${this.base}/TicketCost`, {
        input: {
          name:        row.name,
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
        if (!record['num_ticket']) throw new Error('num_ticket manquant');
        return {
          num_ticket:      (record['num_ticket'] ?? '').trim(),
          name:            (record['name'] || '').trim() || 'Coût',
          duration_second: Math.round(parseFrenchFloat(record['duration_second'] || '0')),
          time_cost:       parseFrenchFloat(record['time_cost']  || '0'),
          fixed_cost:      parseFrenchFloat(record['fixed_cost'] || '0'),
        };
      })
    );
  }
}
