import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../environment';
import { Ticket } from '@app/core/models';

interface GlpiTicketRaw {
  id: number; name: string; content: string; date: string;
  type: number; status: number; priority: number;
}

export interface CreateTicketInput {
  titre: string; description: string; type: number; priority: number;
}

@Injectable({ providedIn: 'root' })
export class TicketService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.glpi.v1ApiUrl}/Ticket`;
  private readonly itemTicketBase = `${environment.glpi.v1ApiUrl}/Item_Ticket`;

  async getAll(): Promise<Ticket[]> {
    const raws = await firstValueFrom(this.http.get<GlpiTicketRaw[]>(this.base));
    return raws.map(r => this.map(r));
  }

  async getById(id: number): Promise<Ticket> {
    const raw = await firstValueFrom(this.http.get<GlpiTicketRaw>(`${this.base}/${id}`));
    return this.map(raw);
  }

  create(data: CreateTicketInput): Promise<{ id: number }> {
    return firstValueFrom(this.http.post<{ id: number }>(this.base, {
      input: { name: data.titre, content: data.description, type: data.type, priority: data.priority },
    }));
  }

  addItem(ticketId: number, itemtype: string, itemsId: number): Promise<void> {
    return firstValueFrom(this.http.post<void>(this.itemTicketBase, {
      input: { tickets_id: ticketId, itemtype, items_id: itemsId },
    }));
  }

  update(id: number, data: Partial<Ticket>): Promise<void> {
    return firstValueFrom(this.http.put<void>(`${this.base}/${id}`, { input: data }));
  }

  delete(id: number): Promise<void> {
    return firstValueFrom(this.http.delete<void>(`${this.base}/${id}`));
  }

  private map(raw: GlpiTicketRaw): Ticket {
    const [date = '', heure = ''] = (raw.date ?? '').split(' ');
    return { id: raw.id, ref_ticket: raw.id, date, heure, type: raw.type,
             titre: raw.name, description: raw.content, status: raw.status,
             priority: raw.priority, items: [] };
  }
}
