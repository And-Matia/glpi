import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../environment';
import { ItemType } from '@app/core/models';
import { ASSET_TYPES } from '@app/core/models/asset.model';

interface GlpiNamed  { id: number; name: string; }
interface GlpiTicket { id: number; externalid: string | null; }

@Injectable({ providedIn: 'root' })
export class GlpiLookupService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.glpi.v1ApiUrl;

  // Searches every asset type in order and returns the first item whose name matches.
  async findItemByName(name: string): Promise<{ id: number; type: ItemType } | null> {
    const clean = (name ?? '').trim();
    if (!clean) return null;

    for (const cfg of ASSET_TYPES) {
      const params = new HttpParams().set('searchText[name]', clean).set('range', '0-99');
      let list: GlpiNamed[] = [];
      try {
        list = await firstValueFrom(this.http.get<GlpiNamed[]>(`${this.base}/${encodeURIComponent(cfg.apiType)}`, { params }));
      } catch { list = []; }

      const found = (list ?? []).find(x => (x.name ?? '').trim().toLowerCase() === clean.toLowerCase());
      if (found) return { id: found.id, type: cfg.itemtype as ItemType };
    }

    return null;
  }

  async findTicketIdByRef(ref: number | string): Promise<number | null> {
    const clean = String(ref ?? '').trim();
    if (!clean) return null;

    const params = new HttpParams().set('searchText[externalid]', clean).set('range', '0-99');
    let list: GlpiTicket[];
    try {
      list = await firstValueFrom(this.http.get<GlpiTicket[]>(`${this.base}/Ticket`, { params }));
    } catch { list = []; }

    const found = (list ?? []).find(t => String(t.externalid ?? '').trim() === clean);
    return found ? found.id : null;
  }
}
