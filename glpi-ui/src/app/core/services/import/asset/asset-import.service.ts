import {inject, Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {firstValueFrom} from 'rxjs';
import {GLPI_CONFIG} from '@app/core/config/glpi.config';
import {ItemType} from '@app/core/models';
import {GlpiDropdownService} from '@app/core/services/glpi/lookup/dropdown.service';
import {ASSET_ITEMTYPES, assetType} from '@app/core/constants/asset.constants';
import {parseCsvText, ParseResult} from '@app/core/utils/csv.utils';
import {UserService} from '@app/core/services/glpi/api/user.service';
import {GlpiBaseImportService} from '../base/glpi-base-import.service';

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
export class AssetImportService extends GlpiBaseImportService<ItemRow> {
  private readonly http = inject(HttpClient);
  private readonly dropdown = inject(GlpiDropdownService);
  private readonly userService = inject(UserService);
  private readonly base = GLPI_CONFIG.apiV1;

  protected async importRow(row: ItemRow): Promise<void> {
    const cfg = assetType(row.item_type)!;

    const [states_id, locations_id, manufacturers_id, users_id, model_id] = await Promise.all([
      this.dropdown.resolve('State', row.status),
      this.dropdown.resolve('Location', row.location),
      this.dropdown.resolve('Manufacturer', row.manufacturer),
      this.userService.resolve(row.user),
      cfg.modelType ? await this.dropdown.resolve(cfg.modelType, row.model) : Promise.resolve(0)
    ])

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

  protected parseFile(file: File): Promise<ParseResult<ItemRow>> {
    return file.text().then(text =>
      parseCsvText<ItemRow>(text, record => {
        if (!record['name']) throw new Error('Nom manquant');
        const type = record['item_type'];
        if (!ASSET_ITEMTYPES.includes(type)) {
          throw new Error(`Type inconnu: ${type} (attendus : ${ASSET_ITEMTYPES.join(', ')})`);
        }
        return {
          name: record['name'],
          status: record['status'] ?? '',
          location: record['location'] ?? '',
          manufacturer: record['manufacturer'] ?? '',
          item_type: type as ItemType,
          model: record['model'] ?? '',
          inventory_number: record['inventory_number'] ?? '',
          user: record['user'] ?? '',
        };
      })
    );
  }
}
