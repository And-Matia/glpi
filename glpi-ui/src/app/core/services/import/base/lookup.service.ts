import {inject, Injectable} from '@angular/core';
import {HttpClient, HttpParams} from '@angular/common/http';
import {firstValueFrom} from 'rxjs';
import {ItemType} from '@app/core/models';
import {ASSET_TYPES} from '@app/core/constants/asset.constants';
import {GLPI_CONFIG} from '@app/core/config/glpi.config';

interface GlpiNamed {
  id: number;
  name: string;
}

interface GlpiTicket {
  id: number;
  externalid: string | null;
}

@Injectable({providedIn: 'root'})
export class GlpiLookupService {
  private readonly http = inject(HttpClient);
  private readonly base = GLPI_CONFIG.apiV1;

  async findItemByName(name: string): Promise<{ id: number; type: ItemType } | null> {
    const clean = (name ?? '').trim();
    if (!clean) return null;

    const results = await Promise.all(
      ASSET_TYPES.map(async cfg => {
          const params = new HttpParams().set('searchText[name]', clean).set('range', '0-99');
          try {
            const list = await firstValueFrom((this.http.get<GlpiNamed[]>(`${this.base}/${encodeURIComponent(cfg.apiType)}`, {params})));
            const found = (list ?? []).find(x => (x.name ?? '').trim().toLowerCase() === clean.toLowerCase());
            return found? {id: found.id, type: cfg.itemtype as ItemType} : null
          } catch {
            return null
          }
        }
      )
    )

    return results.find(r => r !== null) ?? null;
  }

  async findTicketIdByRef(ref: number | string): Promise<number | null> {
    const clean = String(ref ?? '').trim();
    if (!clean) return null;

    const params = new HttpParams().set('searchText[externalid]', clean).set('range', '0-99');
    const list = await firstValueFrom(
      this.http.get<GlpiTicket[]>(`${this.base}/Ticket`, {params})
    ).catch((): GlpiTicket[] => []);

    const found = list.find(t => String(t.externalid ?? '').trim() === clean);
    return found ? found.id : null;
  }
}
