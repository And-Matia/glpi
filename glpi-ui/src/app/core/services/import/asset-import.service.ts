import {inject, Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {firstValueFrom} from 'rxjs';
import {environment} from '../../../../environment';
import {ItemType} from '@app/core/models';
import {GlpiDropdownService} from '@app/core/services/glpi/dropdown.service';
import {ASSET_ITEMTYPES, assetType} from '@app/core/models/asset.model';
import {parseCsvText, ParseResult} from '@app/core/utils/csv.utils';
import {UserService} from '@app/core/services/glpi/user.service';
import {GlpiBaseImportService} from './glpi-base-import.service';

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
  private readonly base = environment.glpi.v1ApiUrl;

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
