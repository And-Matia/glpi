import {inject, Injectable} from '@angular/core';
import {HttpClient, HttpParams} from '@angular/common/http';
import {SPRING_CONFIG} from '@app/core/config/spring.config';
import {firstValueFrom} from 'rxjs';
import {SuperCost} from '@app/core/models/super-cost.model';

@Injectable({providedIn: 'root'})
export class SuperCostService {
  private readonly http = inject(HttpClient);
  private readonly base = `${SPRING_CONFIG.apiUrl}/super-cost`;

  create(id: number, value: String): Promise<{ id: number }> {
  const input = {idTicket: id, value: value};
    return firstValueFrom(this.http.post<{ id: number }>(this.base, {
      id_ticket: input.idTicket,
      value: input.value,
    }));
  }

  async getAll(): Promise<SuperCost[]> {
    let result;
    result = await firstValueFrom(this.http.get(`${this.base}`));
    return (result as SuperCost[]).map(r => this.map(r));
  }

  private map(raw: SuperCost): SuperCost {
    return {
      id:       raw.id,
      ticketId: raw.ticketId,
      value:    raw.value,
    };
  }

}
