import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { GLPI_CONFIG } from '@app/core/config/glpi.config';
import { TicketCost } from '@app/core/models';

interface GlpiTicketCostRaw {
  id: number;
  name: string;
  tickets_id: number;
  actiontime: number;
  cost_time: number;
  cost_fixed: number;
  cost_material: number;
  begin_date: string | null;
  end_date: string | null;
}

@Injectable({ providedIn: 'root' })
export class TicketCostService {
  private readonly http = inject(HttpClient);
  private readonly base = `${GLPI_CONFIG.apiV1}/TicketCost`;

  async getAll(): Promise<TicketCost[]> {
    return this.fetch(`${this.base}?range=0-9999`);
  }

  async getByTicketId(ticketId: number): Promise<TicketCost[]> {
    const all = await this.getAll();
    return all.filter(c => c.num_ticket === ticketId);
  }

  async getById(id: number): Promise<TicketCost> {
    const raw = await firstValueFrom(this.http.get<GlpiTicketCostRaw>(`${this.base}/${id}`));
    return this.map(raw);
  }

  create(data: Partial<TicketCost>): Promise<{ id: number }> {
    return firstValueFrom(this.http.post<{ id: number }>(this.base, { input: data }));
  }

  update(id: number, data: Partial<TicketCost>): Promise<void> {
    return firstValueFrom(this.http.put<void>(`${this.base}/${id}`, { input: data }));
  }

  delete(id: number, forcePurge = false): Promise<void> {
    return firstValueFrom(
      this.http.delete<void>(`${this.base}/${id}${forcePurge ? '/' : ''}`)
    );
  }

  private async fetch(url: string): Promise<TicketCost[]> {
    let result: unknown;
    try {
      result = await firstValueFrom(this.http.get(url));
    } catch {
      return [];
    }
    if (!Array.isArray(result)) return [];
    return (result as GlpiTicketCostRaw[]).map(r => this.map(r));
  }

  private map(raw: GlpiTicketCostRaw): TicketCost {
    return {
      id:              raw.id,
      name:            raw.name          ?? '',
      num_ticket:      Number(raw.tickets_id),
      duration_second: Number(raw.actiontime)    || 0,
      time_cost:       Number(raw.cost_time)     || 0,
      fixed_cost:      Number(raw.cost_fixed)    || 0,
      cost_material:   Number(raw.cost_material) || 0,
      begin_date:      raw.begin_date ?? null,
      end_date:        raw.end_date   ?? null,
    };
  }
}
