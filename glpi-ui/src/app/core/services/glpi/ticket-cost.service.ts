import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../environment';
import { TicketCost } from '@app/core/models';

interface GlpiTicketCostRaw {
  id: number;
  tickets_id: number;
  actiontime: number;
  cost_time: number;
  cost_fixed: number;
}

@Injectable({ providedIn: 'root' })
export class TicketCostService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.glpi.v1ApiUrl}/TicketCost`;

  async getAll(): Promise<TicketCost[]> {
    const raws = await firstValueFrom(this.http.get<GlpiTicketCostRaw[]>(this.base));
    return raws.map(r => this.mapCost(r));
  }

  async getById(id: number): Promise<TicketCost> {
    const raw = await firstValueFrom(this.http.get<GlpiTicketCostRaw>(`${this.base}/${id}`));
    return this.mapCost(raw);
  }

  create(data: Partial<TicketCost>): Promise<{ id: number }> {
    return firstValueFrom(this.http.post<{ id: number }>(this.base, { input: data }));
  }

  update(id: number, data: Partial<TicketCost>): Promise<void> {
    return firstValueFrom(this.http.put<void>(`${this.base}/${id}`, { input: data }));
  }

  delete(id: number, forcePurge?: boolean): Promise<void> {
    return firstValueFrom(this.http.delete<void>(forcePurge ? `${this.base}/${id}/` : `${this.base}/${id}`));
  }

  private mapCost(raw: GlpiTicketCostRaw): TicketCost {
    return {
      id:              raw.id,
      num_ticket:      raw.tickets_id,
      duration_second: raw.actiontime,
      time_cost:       raw.cost_time,
      fixed_cost:      raw.cost_fixed,
    };
  }
}
