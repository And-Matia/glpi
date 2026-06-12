import {inject, Injectable} from '@angular/core';
import {HttpClient, HttpParams} from '@angular/common/http';
import {firstValueFrom} from 'rxjs';
import {GLPI_CONFIG} from '@app/core/config/glpi.config';
import {Ticket} from '@app/core/models';

interface GlpiCodedField { id: number; name: string; }

interface GlpiTicketRawV2 {
  id: number;
  name: string;
  content: string;
  date: string | null;
  date_creation: string | null;
  date_mod: string | null;
  date_close: string | null;
  date_solve: string | null;
  type: number;
  status: GlpiCodedField;
  priority: number;
  externalid: string | null;
}

export interface CreateTicketInput {
  titre: string;
  description: string;
  type: number;
  priority: number;
  status?: number;
}

@Injectable({providedIn: 'root'})
export class TicketService {
  private readonly http = inject(HttpClient);
  private readonly base = `${GLPI_CONFIG.apiV1}/Ticket`;
  private readonly baseV2 = `${GLPI_CONFIG.apiV2}/Assistance/Ticket`;
  private readonly itemTicketBase = `${GLPI_CONFIG.apiV1}/Item_Ticket`;

  async getAll(): Promise<Ticket[]> {
    const params = new HttpParams()
      .set('filter[is_deleted]', '0')
      .set('limit', '9999');
    const raws = await firstValueFrom(this.http.get<GlpiTicketRawV2[]>(this.baseV2, {params}));
    return raws.map(r => this.mapV2(r));
  }

  async getById(id: number): Promise<Ticket> {
    const raw = await firstValueFrom(this.http.get<GlpiTicketRawV2>(`${this.baseV2}/${id}`));
    return this.mapV2(raw);
  }

  create(data: CreateTicketInput): Promise<{ id: number }> {
    return firstValueFrom(this.http.post<{ id: number }>(this.base, {
      input: {name: data.titre, content: data.description, type: data.type, priority: data.priority, status: data.status},
    }));
  }

  addItem(ticketId: number, itemtype: string, itemsId: number): Promise<void> {
    return firstValueFrom(this.http.post<void>(this.itemTicketBase, {
      input: {tickets_id: ticketId, itemtype, items_id: itemsId},
    }));
  }

  update(id: number, data: Partial<Ticket>): Promise<void> {
    return firstValueFrom(this.http.put<void>(`${this.base}/${id}`, {input: data}));
  }

  assign(id: number, type: 'user' | 'group' | 'supplier', assigneeId: number): Promise<void> {
    const field = type === 'user' ? '_users_id_assign'
                : type === 'group' ? '_groups_id_assign'
                : '_suppliers_id_assign';
    return firstValueFrom(this.http.put<void>(`${this.base}/${id}`, {
      input: { status: 2, [field]: assigneeId },
    }));
  }

  postSolution(id: number, content: string): Promise<void> {
    return firstValueFrom(this.http.post<void>(`${this.base}/${id}/ITILSolution`, {
      input: { itemtype: 'Ticket', items_id: id, content },
    }));
  }

  delete(id: number): Promise<void> {
    return firstValueFrom(this.http.delete<void>(`${this.base}/${id}`));
  }

  async getLinkedItems(ticketId: number): Promise<{ items_id: number; itemtype: string }[]> {
    let result: unknown;
    try {
      result = await firstValueFrom(this.http.get(`${this.base}/${ticketId}/Item_Ticket/?range=0-999`));
    } catch {
      return [];
    }
    if (!Array.isArray(result)) return [];
    return result as { items_id: number; itemtype: string }[];
  }

  private parseIso(iso: string | null): string {
    return iso ? iso.split('T')[0] : '';
  }

  private mapV2(raw: GlpiTicketRawV2): Ticket {
    const [date = '', timeWithTz = ''] = (raw.date ?? '').split('T');
    const heure = timeWithTz.substring(0, 5);
    return {
      id:            raw.id,
      ref_ticket:    raw.id,
      date,
      heure,
      type:          raw.type,
      titre:         raw.name,
      description:   raw.content,
      status:        raw.status.id,
      priority:      raw.priority,
      items:         [],
      date_creation: this.parseIso(raw.date_creation),
      date_mod:      this.parseIso(raw.date_mod),
      date_close:    raw.date_close  ? this.parseIso(raw.date_close)  : null,
      date_solve:    raw.date_solve  ? this.parseIso(raw.date_solve)  : null,
    };
  }
}
