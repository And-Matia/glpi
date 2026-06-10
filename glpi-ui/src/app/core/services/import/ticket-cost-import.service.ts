import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../environment';
import { ImportStats } from '@app/core/models';
import { GlpiLookupService } from './lookup.service';
import { parseCsvText, parseFrenchFloat, ParseResult } from '@app/core/utils/csv.utils';

interface TicketCostRow {
  num_ticket:      string; // CSV reference, e.g. "TK-001" or "1" — kept as text
  duration_second: number;
  time_cost:       number;
  fixed_cost:      number;
}

@Injectable({ providedIn: 'root' })
export class TicketCostImportService {
  private readonly http   = inject(HttpClient);
  private readonly lookup = inject(GlpiLookupService);
  private readonly base   = environment.glpi.v1ApiUrl;

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

  private async importRow(row: TicketCostRow): Promise<void> {
    // Map the CSV ticket reference to the real GLPI id by querying the ticket whose
    // `externalid` carries that reference (set during the ticket import). GLPI ids
    // are auto-incremented, so we must NOT assume num_ticket === id.
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

  private parseFile(file: File): Promise<ParseResult<TicketCostRow>> {
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
