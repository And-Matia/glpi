import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { environment } from '../../../../environment';
import {Ticket} from '@app/core/models';

interface GlpiV2Ticket {
  id: number;
  name: string;
  content: string;
  date: string;
  type: number;
  status: number;
  priority: number;
}

@Injectable({ providedIn: 'root' })
export class TicketV2Service {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.glpi.v2ApiUrl}/Assistance/Ticket`;

  getAll(filter?: string): Observable<Ticket[]> {
    const params = filter ? new HttpParams().set('filter', filter) : undefined;
    return this.http.get<GlpiV2Ticket[]>(this.base, { params }).pipe(
      map(raws => raws.map(r => this.mapTicket(r)))
    );
  }

  getById(id: number): Observable<Ticket> {
    return this.http.get<GlpiV2Ticket>(`${this.base}/${id}`).pipe(
      map(r => this.mapTicket(r))
    );
  }

  private mapTicket(raw: GlpiV2Ticket): Ticket {
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
