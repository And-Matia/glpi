import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { forkJoin, from, Observable, of } from 'rxjs';
import { catchError, concatMap, map, switchMap, toArray } from 'rxjs/operators';
import { environment } from '../../../../environment';
import { ImportStats, ItemType } from '@app/core/models';
import { ImportRegistryService } from './import-registry.service';
import { GlpiDropdownService } from '@app/core/services/glpi/dropdown.service';
import { parseCsvText, ParseResult } from '@app/core/utils/csv.utils';

interface ItemRow {
  name:             string;
  status:           string;
  location:         string;
  manufacturer:     string;
  item_type:        ItemType;
  model:            string;
  inventory_number: string;
  user:             string;
}

@Injectable({ providedIn: 'root' })
export class ItemImportService {
  private readonly http     = inject(HttpClient);
  private readonly registry = inject(ImportRegistryService);
  private readonly dropdown = inject(GlpiDropdownService);
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

  private importRows(rows: ItemRow[]): Observable<ImportStats> {
    const stats: ImportStats = { total: rows.length, success: 0, failed: 0, errors: [] };
    if (!rows.length) return of(stats);

    // Sequential (concatMap) so the dropdown cache is shared safely across rows.
    return from(rows).pipe(
      concatMap((row, i) =>
        this.importRow(row).pipe(
          map(({ id }) => {
            stats.success++;
            this.registry.registerItem(row.name, id, row.item_type);
            return null;
          }),
          catchError(err => {
            stats.failed++;
            stats.errors.push({ row: i + 2, error: this.errorText(err) });
            return of(null);
          })
        )
      ),
      toArray(),
      map(() => stats)
    );
  }

  private importRow(row: ItemRow): Observable<{ id: number }> {
    const isComputer  = row.item_type === 'Computer';
    const endpoint    = isComputer ? 'Computer' : 'Monitor';
    const modelType   = isComputer ? 'ComputerModel' : 'MonitorModel';
    const modelField  = isComputer ? 'computermodels_id' : 'monitormodels_id';

    // Resolve every GLPI dropdown to a real id (creating it on the fly).
    return forkJoin({
      states_id:        this.dropdown.resolve('State', row.status),
      locations_id:     this.dropdown.resolve('Location', row.location),
      manufacturers_id: this.dropdown.resolve('Manufacturer', row.manufacturer),
      model_id:         this.dropdown.resolve(modelType, row.model),
    }).pipe(
      switchMap(({ states_id, locations_id, manufacturers_id, model_id }) => {
        const input: Record<string, unknown> = {
          name:        row.name,
          otherserial: row.inventory_number,
          contact:     row.user,           // CSV "User" → asset contact (visible in GLPI)
          states_id,
          locations_id,
          manufacturers_id,
          [modelField]: model_id,
        };
        return this.http.post<{ id: number }>(`${this.base}/${endpoint}`, { input });
      })
    );
  }

  private errorText(err: unknown): string {
    if (err && typeof err === 'object' && 'error' in err) {
      const body = (err as { error: unknown }).error;
      if (Array.isArray(body)) return body.join(' — ');
      if (typeof body === 'string') return body;
    }
    return err instanceof Error ? err.message : String(err);
  }

  private parseFile(file: File): Promise<ParseResult<ItemRow>> {
    return file.text().then(text =>
      parseCsvText<ItemRow>(text, record => {
        if (!record['Name']) throw new Error('Nom manquant');
        const type = record['Item_Type'];
        if (type !== 'Computer' && type !== 'Monitor') throw new Error(`Type inconnu: ${type}`);
        return {
          name:             record['Name'],
          status:           record['Status']           ?? '',
          location:         record['Location']         ?? '',
          manufacturer:     record['Manufacturer']     ?? '',
          item_type:        type as ItemType,
          model:            record['Model']            ?? '',
          inventory_number: record['Inventory_Number'] ?? '',
          user:             record['User']             ?? '',
        };
      })
    );
  }
}
