import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { TicketStatus } from '@app/core/models';
import { environment } from '../../../../environment';

@Injectable({ providedIn: 'root' })
export class TicketStatusService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.coreApiUrl}/tickets/status`;

  getStatuses(): Promise<TicketStatus[]> {
    return firstValueFrom(this.http.get<TicketStatus[]>(this.base));
  }

  createStatus(status: TicketStatus): Promise<TicketStatus> {
    return firstValueFrom(this.http.post<TicketStatus>(this.base, status));
  }

  updateStatus(status: TicketStatus): Promise<TicketStatus> {
    return firstValueFrom(this.http.put<TicketStatus>(this.base, status));
  }
}
