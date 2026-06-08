import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { environment } from '../../../../../environment';
import {TicketCost} from '@app/core/models';

interface GlpiTicketCostRaw {
  id: number;
  tickets_id: number;
  actiontime: number;
  cost_time: number;
  cost_fixed: number;
}

@Injectable({ providedIn: 'root' })
export class TicketCostV1Service {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.glpi.v1ApiUrl}/TicketCost`;

  getAll(): Observable<TicketCost[]> {
    return this.http.get<GlpiTicketCostRaw[]>(this.base).pipe(
      map(raws => raws.map(r => this.mapCost(r)))
    );
  }

  getById(id: number): Observable<TicketCost> {
    return this.http.get<GlpiTicketCostRaw>(`${this.base}/${id}`).pipe(
      map(r => this.mapCost(r))
    );
  }

  create(data: Partial<TicketCost>): Observable<{ id: number }> {
    return this.http.post<{ id: number }>(this.base, { input: data });
  }

  update(id: number, data: Partial<TicketCost>): Observable<void> {
    return this.http.put<void>(`${this.base}/${id}`, { input: data });
  }

  delete(id: number,forcePurge?: boolean): Observable<void> {
    return this.http.delete<void>(forcePurge?`${this.base}/${id}/`:`${this.base}/${id}`);
  }

  private mapCost(raw: GlpiTicketCostRaw): TicketCost {
    return {
      id: raw.id,
      num_ticket: raw.tickets_id,
      duration_second: raw.actiontime,
      time_cost: raw.cost_time,
      fixed_cost: raw.cost_fixed
    };
  }
}
