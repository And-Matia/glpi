import { inject, Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { SPRING_CONFIG } from '@app/core/config/spring.config';
import { TicketStatus } from '@app/core/models';

export interface KanbanColumn {
  statusCode: number;
  labelFr: string;
  labelMg: string;
  color: string;
}

const GLPI_CODES = [1, 2, 6] as const;

@Injectable({ providedIn: 'root' })
export class TicketStatusService {
  private readonly http = inject(HttpClient);
  private readonly base = `${SPRING_CONFIG.apiUrl}/tickets/status`;
  private readonly _columns = signal<KanbanColumn[]>([]);

  readonly columns = computed(() => this._columns());

  getStatuses(): Promise<TicketStatus[]> {
    return firstValueFrom(this.http.get<TicketStatus[]>(this.base));
  }

  updateStatus(status: TicketStatus): Promise<TicketStatus> {
    return firstValueFrom(this.http.put<TicketStatus>(this.base, status));
  }

  createStatus(status: TicketStatus): Promise<TicketStatus> {
    return firstValueFrom(this.http.post<TicketStatus>(this.base, status));
  }

  getColumns(): KanbanColumn[] {
    return this._columns();
  }

  setColumns(columns: KanbanColumn[]): void {
    this._columns.set([...columns]);
  }

  mapStatusesToColumns(statuses: TicketStatus[]): KanbanColumn[] {
    return statuses.slice(0, GLPI_CODES.length).map((status, i) => ({
      statusCode: GLPI_CODES[i],
      labelFr: status.names.find(n => /^fr/i.test(n.language.name))?.name ?? '',
      labelMg: status.names.find(n => /^mg|malagasy/i.test(n.language.name))?.name ?? '',
      color: status.color,
    }));
  }
}
