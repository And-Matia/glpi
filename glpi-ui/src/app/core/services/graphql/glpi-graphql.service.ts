import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { environment } from '../../../../environment';
import { Ticket ,TicketCost} from '@app/core/models';

export interface DashboardData {
  computers: number;
  monitors: number;
  tickets: number;
}

export interface TicketWithDetails extends Ticket {
  costs: TicketCost[];
}

interface GqlResponse<T> {
  data: T;
}

@Injectable({ providedIn: 'root' })
export class GlpiGraphqlService {
  private readonly http = inject(HttpClient);
  private readonly url = environment.glpi.graphqlUrl;

  getDashboardData(): Observable<DashboardData> {
    const query = `{
      queryComputer { totalCount }
      queryMonitor  { totalCount }
      queryTicket   { totalCount }
    }`;
    return this.http.post<GqlResponse<{
      queryComputer: { totalCount: number };
      queryMonitor:  { totalCount: number };
      queryTicket:   { totalCount: number };
    }>>(this.url, { query }).pipe(
      map(res => ({
        computers: res.data.queryComputer.totalCount,
        monitors:  res.data.queryMonitor.totalCount,
        tickets:   res.data.queryTicket.totalCount
      }))
    );
  }

  getTicketWithDetails(id: number): Observable<TicketWithDetails> {
    const query = `{
      queryTicket(filter: "id == ${id}") {
        edges {
          node {
            id
            name
            content
            date
            type
            status
            priority
            Items_Ticket { itemtype items_id }
            TicketCost { actiontime cost_time cost_fixed }
          }
        }
      }
    }`;
    type RawNode = {
      id: number; name: string; content: string; date: string;
      type: number; status: number; priority: number;
      Items_Ticket: { itemtype: string; items_id: number }[];
      TicketCost: { actiontime: number; cost_time: number; cost_fixed: number }[];
    };
    return this.http.post<GqlResponse<{ queryTicket: { edges: { node: RawNode }[] } }>>(
      this.url, { query }
    ).pipe(
      map(res => {
        const n = res.data.queryTicket.edges[0].node;
        const [date = '', heure = ''] = (n.date ?? '').split(' ');
        return {
          id: n.id,
          ref_ticket: n.id,
          date, heure,
          type: n.type,
          titre: n.name,
          description: n.content,
          status: n.status,
          priority: n.priority,
          items: n.Items_Ticket.map(i => `${i.itemtype}:${i.items_id}`),
          costs: n.TicketCost.map((c, idx) => ({
            id: idx,
            num_ticket: id,
            duration_second: c.actiontime,
            time_cost: c.cost_time,
            fixed_cost: c.cost_fixed
          }))
        };
      })
    );
  }
}
