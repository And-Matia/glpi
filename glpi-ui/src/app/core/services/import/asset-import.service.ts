import {inject, Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import {environment} from '../../../../environment';
import {ImportStats} from '@app/core/models/import.model';
import {ItemType} from '@app/core/models';
import {GlpiDropdownService} from '@app/core/services/glpi/dropdown.service';
import {ASSET_ITEMTYPES, assetType} from '@app/core/models/asset.model';
import {parseCsvText, ParseResult} from '@app/core/utils/csv.utils';
import {UserService} from "../glpi/user.service";

interface ItemRow {
  name: string;
  status: string;
  location: string;
  manufacturer: string;
  item_type: ItemType;
  model: string;
  inventory_number: string;
  user: string;
}

@Injectable({providedIn: 'root'})
export class AssetImportService {
  private readonly http = inject(HttpClient);
  private readonly dropdown = inject(GlpiDropdownService);
  private readonly userService = inject(UserService);
  private readonly base = environment.glpi.v1ApiUrl;

  importFile(file: File): Promise<ImportStats> {
    return this.doImport(file);
  }

  async validateFile(file: File): Promise<string[]> {
    try {
      const {errors} = await this.parseFile(file);
      return errors.map(e => `Ligne ${e.row}: ${e.error}`);
    } catch (e) {
      return [e instanceof Error ? e.message : 'Erreur inconnue'];
    }
  }

  private async doImport(file: File): Promise<ImportStats> {
    const {rows, errors: parseErrors} = await this.parseFile(file);

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
        stats.errors.push({row: i + 2, error: this.errorText(err)});
      }
    }

    return stats;
  }

  private async importRow(row: ItemRow): Promise<void> {
    const cfg = assetType(row.item_type)!;

    const states_id       = await this.dropdown.resolve('State', row.status);
    const locations_id    = await this.dropdown.resolve('Location', row.location);
    const manufacturers_id = await this.dropdown.resolve('Manufacturer', row.manufacturer);
    const users_id        = await this.userService.resolve(row.user);
    const model_id        = cfg.modelType ? await this.dropdown.resolve(cfg.modelType, row.model) : 0;

    const input: Record<string, unknown> = {
      name: row.name,
      otherserial: row.inventory_number,
      users_id,
      states_id,
      locations_id,
      manufacturers_id,
    };
    if (cfg.modelField) input[cfg.modelField] = model_id;

    await firstValueFrom(this.http.post<{ id: number }>(`${this.base}/${encodeURIComponent(cfg.apiType)}`, {input}));
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
          name: record['Name'],
          status: record['Status'] ?? '',
          location: record['Location'] ?? '',
          manufacturer: record['Manufacturer'] ?? '',
          item_type: type as ItemType,
          model: record['Model'] ?? '',
          inventory_number: record['Inventory_Number'] ?? '',
          user: record['User'] ?? '',
        };
      })
    );
  }
}
