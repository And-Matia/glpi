import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom, from, Observable } from 'rxjs';
import { environment } from '../../../environment';
import { ASSET_API_TYPES } from '@app/core/models/glpi/assets/glpi-asset.model';
import {UserV1Service} from '@app/core/services/glpi/entities/user/user-v1.service';

const USER_TO_SKIP = [1, 2, 3, 4, 5, 6];
const ENTITIES = ['TicketCost', 'Item_Ticket', 'Document_Item', 'Ticket', 'Document', ...ASSET_API_TYPES];

@Injectable({ providedIn: 'root' })
export class ResetService {
  private readonly http    = inject(HttpClient);
  private readonly baseUrl = environment.glpi.v1ApiUrl;
  private readonly userService = inject(UserV1Service);

  resetAll(): Observable<void> {
    return from(this.deleteAll());
  }

  private async deleteAll(): Promise<void> {
    const users = await firstValueFrom(this.userService.getAll());
    for (const entityType of ENTITIES) {
      const path = encodeURIComponent(entityType);

      let ids: number[] = [];
      try {
        const items = await firstValueFrom(this.http.get<{ id: number }[]>(`${this.baseUrl}/${path}?range=0-9999`));
        ids = items.map(i => i.id);
      } catch { ids = []; }

      for (const id of ids) {
        try {
          await firstValueFrom(this.http.delete<void>(`${this.baseUrl}/${path}/${id}`));
        } catch { /* ignore individual delete failures */ }
      }
    }

    for (const user of users) {
      if (USER_TO_SKIP.includes(user.id)) continue;
      try {
        await firstValueFrom(this.userService.delete(user.id))
      } catch {}
    }
  }
}
