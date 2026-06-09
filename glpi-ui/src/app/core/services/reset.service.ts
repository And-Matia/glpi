import {inject, Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {firstValueFrom, from, Observable} from 'rxjs';
import {environment} from '../../../environment';
import {ASSET_API_TYPES} from '@app/core/models/glpi/assets/glpi-asset.model';
import {UserV1Service} from '@app/core/services/glpi/entities/user/user-v1.service';

const ENTITIES = ['TicketCost', 'Item_Ticket', 'Document_Item', 'Ticket', 'Document', ...ASSET_API_TYPES];

@Injectable({providedIn: 'root'})
export class ResetService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.glpi.v1ApiUrl;
  private readonly userService = inject(UserV1Service);

  resetAll(): Observable<void> {
    return from(this.deleteAll(false));
  }

  resetAllWithTrash(): Observable<void> {
    return from(this.deleteAll(true));
  }

  private async deleteAll(includeTrash: boolean): Promise<void> {
    const users = await firstValueFrom(this.userService.getAll());

    for (const entityType of ENTITIES) {
      const path = encodeURIComponent(entityType);
      const ids = await this.collectIds(path, includeTrash);
      await this.purgeIds(path, ids);
    }

    for (const user of users) {
      if (user.id < 7) continue;
      try {
        await firstValueFrom(this.userService.delete(user.id));
      } catch (e) {
        throw new Error(e instanceof Error ? e.message : 'Erreur inconnue');
      }
    }
  }

  private async collectIds(path: string, includeTrash: boolean): Promise<number[]> {
    const fetch = async (deleted: boolean): Promise<number[]> => {
      try {
        const url = `${this.baseUrl}/${path}?range=0-9999${deleted ? '&is_deleted=1' : ''}`;
        const items = await firstValueFrom(this.http.get<{ id: number }[]>(url));
        return items.map(i => i.id);
      } catch {
        return [];
      }
    };

    const active = await fetch(false);
    if (!includeTrash) return active;

    const trash = await fetch(true);
    return [...new Set([...active, ...trash])];
  }

  private async purgeIds(path: string, ids: number[]): Promise<void> {
    for (const id of ids) {
      try {
        await firstValueFrom(this.http.delete<void>(`${this.baseUrl}/${path}/${id}/?force_purge=1`));
      } catch (e) {
        throw new Error(e instanceof Error ? e.message : 'Erreur inconnue');
      }
    }
  }
}
