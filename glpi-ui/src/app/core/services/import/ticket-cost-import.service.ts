import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { from, Observable, of, throwError } from 'rxjs';
import { catchError, concatMap, map, switchMap, toArray } from 'rxjs/operators';
import { environment } from '../../../../environment';
import { ImportStats } from '@app/core/models';
import { ImportRegistryService } from './import-registry.service';
import { parseCsvText, parseFrenchFloat, ParseResult } from '@app/core/utils/csv.utils';

interface TicketCostRow {
  num_ticket:      number;
  duration_second: number;
  time_cost:       number;
  fixed_cost:      number;
}

@Injectable({ providedIn: 'root' })
export class TicketCostImportService {
  private readonly http     = inject(HttpClient);
  private readonly registry = inject(ImportRegistryService);
  private readonly base     = environment.glpi.v1ApiUrl;

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

  private importRows(rows: TicketCostRow[]): Observable<ImportStats> {
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

  private importRow(row: TicketCostRow): Observable<void> {
    // Map the CSV ticket reference to the real GLPI id created during the ticket
    // import. GLPI ids are auto-incremented, so we must NOT assume num_ticket === id.
    const ticketId = this.registry.getTicketId(row.num_ticket);
    if (ticketId === undefined) {
      return throwError(() => new Error(
        `Ticket #${row.num_ticket} introuvable : importez d'abord la feuille des tickets (feuille 2).`,
      ));
    }

    return this.http.post<void>(`${this.base}/TicketCost`, {
      input: {
        tickets_id:  ticketId,
        actiontime:  row.duration_second,
        cost_time:   row.time_cost,
        cost_fixed:  row.fixed_cost,
      },
    });
  }

  private parseFile(file: File): Promise<ParseResult<TicketCostRow>> {
    return file.text().then(text =>
      parseCsvText<TicketCostRow>(text, record => {
        if (!record['Num_Ticket']) throw new Error('Num_Ticket manquant');
        return {
          num_ticket:      Number(record['Num_Ticket'])  || 0,
          duration_second: Number(record['Duration_second']) || 0,
          time_cost:       parseFrenchFloat(record['Time_Cost']  ?? '0'),
          fixed_cost:      parseFrenchFloat(record['Fixed_Cost'] ?? '0'),
        };
      })
    );
  }
}
