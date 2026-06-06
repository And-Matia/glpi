import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { environment } from '../../../../environment';
import {Ticket} from '@app/core/models';

interface GlpiTicketRaw {
  id: number;
  name: string;
  content: string;
  date: string;
  type: number;
  status: number;
  priority: number;
}

@Injectable({ providedIn: 'root' })
export class TicketV1Service {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.glpi.v1ApiUrl}/Ticket`;

  getAll(): Observable<Ticket[]> {
    return this.http.get<GlpiTicketRaw[]>(this.base).pipe(
      map(raws => raws.map(r => this.mapTicket(r)))
    );
  }

  getById(id: number): Observable<Ticket> {
    return this.http.get<GlpiTicketRaw>(`${this.base}/${id}`).pipe(
      map(r => this.mapTicket(r))
    );
  }

  create(data: Partial<Ticket>): Observable<{ id: number }> {
    return this.http.post<{ id: number }>(this.base, { input: data });
  }

  update(id: number, data: Partial<Ticket>): Observable<void> {
    return this.http.put<void>(`${this.base}/${id}`, { input: data });
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }

  private mapTicket(raw: GlpiTicketRaw): Ticket {
    const [date = '', heure = ''] = (raw.date ?? '').split(' ');
    return {
      id: raw.id,
      ref_ticket: raw.id,
      date,
      heure,
      type: raw.type,
      titre: raw.name,
      description: raw.content,
      status: raw.status,
      priority: raw.priority,
      items: []
    };
  }
}
