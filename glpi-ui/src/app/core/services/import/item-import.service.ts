import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { forkJoin, from, Observable, of } from 'rxjs';
import { catchError, concatMap, map, switchMap, toArray } from 'rxjs/operators';
import { environment } from '../../../../environment';
import { ImportStats, ItemType } from '@app/core/models';
import { ImportRegistryService } from './import-registry.service';
import { GlpiDropdownService } from '@app/core/services/glpi/dropdown.service';
import { ASSET_ITEMTYPES, assetType } from '@app/core/constants/glpi.constants';
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
  private readonly v2base   = environment.glpi.v2ApiUrl;

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
    const cfg = assetType(row.item_type)!; // validated in parseFile

    // Dropdowns are resolved (find-or-create) over v1, which exposes them cleanly.
    // model is skipped for types that have no {itemtype}Model dropdown in GLPI.
    return forkJoin({
      states_id:        this.dropdown.resolve('State', row.status),
      locations_id:     this.dropdown.resolve('Location', row.location),
      manufacturers_id: this.dropdown.resolve('Manufacturer', row.manufacturer),
      model_id:         cfg.modelType ? this.dropdown.resolve(cfg.modelType, row.model) : of(0),
    }).pipe(
      switchMap(({ states_id, locations_id, manufacturers_id, model_id }) => {
        // v2 create: POST /Assets/{itemtype}. Dropdown FKs are nested {id} objects;
        // a 0 id means "empty" so we omit it. Extra fields a type doesn't have are
        // ignored by GLPI, but we keep the payload tight.
        const input: Record<string, unknown> = { name: row.name };
        if (row.inventory_number) input['otherserial']  = row.inventory_number;
        if (row.user)             input['contact']      = row.user; // CSV "User" → asset contact
        // State dropdown: GLPI names the v2 property `status` for classic assets,
        // `state` for the DCIM/cable family, and omits it for types with no state.
        if (states_id && cfg.stateField) input[cfg.stateField] = { id: states_id };
        if (locations_id)         input['location']     = { id: locations_id };
        if (manufacturers_id)     input['manufacturer'] = { id: manufacturers_id };
        if (model_id)             input['model']        = { id: model_id };
        return this.http.post<{ id: number }>(`${this.v2base}/${cfg.v2Path}`, input);
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
        if (!ASSET_ITEMTYPES.includes(type)) {
          throw new Error(`Type inconnu: ${type} (attendus : ${ASSET_ITEMTYPES.join(', ')})`);
        }
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
