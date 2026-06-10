export interface TicketStatusLanguage {
  id: number;
  name: string;
}

export interface TicketStatusName {
  id?: number;
  name: string;
  language: TicketStatusLanguage;
}

export interface TicketStatus {
  id?: number;
  color: string;
  names: TicketStatusName[];
}

export interface CreateTicketStatusRequest {
  color: string;
  names: Omit<TicketStatusName, 'id'>[];
}

export type UpdateTicketStatusRequest = TicketStatus;
