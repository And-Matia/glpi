import {inject, Injectable, signal} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {firstValueFrom} from 'rxjs';
import {environment} from '../../../../environment';
import {ASSET_API_TYPES} from '@app/core/models/asset.model';
import {UserService} from './user.service';

const ENTITIES = ['TicketCost', 'Item_Ticket', 'Document_Item', 'Ticket', 'Document', ...ASSET_API_TYPES];

export type EntityStatus = 'idle' | 'fetching' | 'deleting' | 'done' | 'error';

export interface EntityProgress {
  label: string;
  status: EntityStatus;
  current: number;
  total: number;
}

@Injectable({providedIn: 'root'})
export class ResetService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.glpi.v1ApiUrl;
  private readonly userService = inject(UserService);

  readonly progress = signal<EntityProgress[]>([]);

  resetAll(): Promise<void> {
    return this.deleteAll(false);
  }

  resetAllWithTrash(): Promise<void> {
    return this.deleteAll(true);
  }

  private patchProgress(id: number, patch: Partial<EntityProgress>): void {
    this.progress.update(list => {
      const next = [...list];
      next[id] = {...next[id], ...patch};
      return next;
    })
  }

  private async deleteAll(includeTrash: boolean): Promise<void> {

    const userProgressId = ENTITIES.length;
    this.progress.set([
      ...ENTITIES.map(e => (
        {
          label: e,
          status: 'idle' as EntityStatus,
          current: 0,
          total: 0
        })), {label: 'Utilisateurs', status: 'idle', current: 0, total: 0}]
    );


    for (let i = 0; i < ENTITIES.length; i++) {
      const path = encodeURIComponent(ENTITIES[i]);
      this.patchProgress(i, {status: 'fetching'});
      const ids = await this.collectIds(path, includeTrash);
      this.patchProgress(i, {status: 'deleting', current: 0, total: ids.length});
      try {
        await this.purgeIds(path, ids, current => {
          this.patchProgress(i, {current});
        });
        this.patchProgress(i, {status: 'done'});
      } catch (e) {
        this.patchProgress(i, {status: 'error'});
        throw e
      }
    }

    this.patchProgress(userProgressId, {status: 'fetching'});
    const users = await this.userService.getAll();
    const deletable = users.filter(u => u.id >= 7);
    this.patchProgress(userProgressId, {status: 'deleting', total: deletable.length, current: 0});

    const USER_CHUNK = 5;
    let deleted = 0;

    for (let i = 0; i < deletable.length; i += USER_CHUNK) {
      const chunk = deletable.slice(i, i + USER_CHUNK);
      await Promise.all(
        chunk.map(user =>
          this.userService.delete(user.id)
            .then(() => {
              deleted++;
              this.patchProgress(userProgressId, {current: deleted});
            })
            .catch(e => {
              this.patchProgress(userProgressId, {status: 'error'});
              throw new Error(e instanceof Error ? e.message : 'Erreur inconnue');
            })
        )
      );
    }

    this.patchProgress(userProgressId, {status: 'done'});
  }

  private async fetch(path: string, deleted: boolean = true): Promise<number[]> {
    const url = `${this.baseUrl}/${path}?range=0-9999${deleted ? '&is_deleted=1' : ''}`;
    const items = await firstValueFrom((this.http.get<{ id: number }[]>(url)));
    return items.map(item => item.id);
  }

  private async collectIds(path: string, includeTrash: boolean): Promise<number[]> {

    const active = await this.fetch(path, false);
    if (!includeTrash) return active;

    const trash = await this.fetch(path, true);
    return [...new Set([...active, ...trash])];
  }

  private async purgeIds(path: string, ids: number[], onProgress: (current: number) => void): Promise<void> {
    const CHUNK = 20;
    let deleted = 0;
    for (let i = 0; i < ids.length; i += CHUNK) {
      const chunk = ids.slice(i, i + CHUNK);
      await Promise.all(
        chunk.map(id =>
          firstValueFrom(
            this.http.delete<void>(`${this.baseUrl}/${path}/${id}/?force_purge=1`)
          ).catch(e => {
            throw new Error(e instanceof Error ? e.message : 'Erreur inconnue');
          })
        )
      )
      deleted += chunk.length;
      onProgress(deleted);
    }
  }
}
