import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environment';
import { TicketStatus, CreateTicketStatusRequest, UpdateTicketStatusRequest } from '../../../models/ticket-status.model';

@Injectable({ providedIn: 'root' })
export class TicketV3Service {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.coreApiUrl}/tickets/status`;

  getStatuses(): Observable<TicketStatus[]> {
    return this.http.get<TicketStatus[]>(this.base);
  }

  createStatus(request: CreateTicketStatusRequest): Observable<TicketStatus> {
    return this.http.post<TicketStatus>(this.base, request);
  }

  updateStatus(request: UpdateTicketStatusRequest): Observable<TicketStatus> {
    return this.http.put<TicketStatus>(this.base, request);
  }
}
