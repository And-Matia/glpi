import { SelectOption } from '@app/shared/ui/select/select.component';

export type TicketVariant = 'primary' | 'success' | 'warning' | 'danger' | 'neutral';

export interface TicketStatusConfig {
  code: number;
  label: string;
  variant: TicketVariant;
}

export interface TicketPriorityConfig {
  code: number;
  label: string;
  variant: TicketVariant;
}

export interface TicketTypeConfig {
  code: number;
  label: string;
}

export const TICKET_STATUSES: TicketStatusConfig[] = [
  { code: 1, label: 'New',                    variant: 'primary' },
  { code: 2, label: 'In Progress (assigned)', variant: 'warning' },
  // { code: 3, label: 'In Progress (planned)',  variant: 'warning' },
  // { code: 4, label: 'Pending',                variant: 'neutral' },
  // { code: 5, label: 'Solved',                 variant: 'success' },
  { code: 6, label: 'Closed',                 variant: 'neutral' },
];

export const TICKET_PRIORITIES: TicketPriorityConfig[] = [
  { code: 1, label: 'Very Low', variant: 'neutral' },
  { code: 2, label: 'Low', variant: 'neutral' },
  { code: 3, label: 'Medium', variant: 'primary' },
  { code: 4, label: 'High', variant: 'warning' },
  { code: 5, label: 'Very High', variant: 'danger' },
  { code: 6, label: 'Major', variant: 'danger' },
];

export const TICKET_TYPES: TicketTypeConfig[] = [
  { code: 1, label: 'Incident' },
  { code: 2, label: 'Request' },
];

export const TICKET_STATUS_CODE: Record<string, number> = Object.fromEntries(
  TICKET_STATUSES.map(s => [s.label, s.code])
);

export const TICKET_TYPE_CODE: Record<string, number> = {
  Incident: 1,
  Request: 2,
  Demande: 2,
};

export const TICKET_PRIORITY_CODE: Record<string, number> = Object.fromEntries(
  TICKET_PRIORITIES.map(p => [p.label, p.code])
);

export function ticketStatus(code: number): TicketStatusConfig | undefined {
  return TICKET_STATUSES.find(s => s.code === code);
}

export function ticketStatusLabel(code: number): string {
  return ticketStatus(code)?.label ?? String(code);
}

export function ticketStatusVariant(code: number): TicketVariant {
  return ticketStatus(code)?.variant ?? 'neutral';
}

export function ticketPriority(code: number): TicketPriorityConfig | undefined {
  return TICKET_PRIORITIES.find(p => p.code === code);
}

export function ticketPriorityLabel(code: number): string {
  return ticketPriority(code)?.label ?? String(code);
}

export function ticketPriorityVariant(code: number): TicketVariant {
  return ticketPriority(code)?.variant ?? 'neutral';
}

export function ticketType(code: number): TicketTypeConfig | undefined {
  return TICKET_TYPES.find(t => t.code === code);
}

export function ticketTypeLabel(code: number): string {
  return ticketType(code)?.label ?? String(code);
}

export const TICKET_TYPE_OPTIONS: SelectOption[] = TICKET_TYPES.map(t => ({
  value: t.code,
  label: t.code === 2 ? 'Demande' : t.label,
}));

export const TICKET_PRIORITY_OPTIONS: SelectOption[] = TICKET_PRIORITIES.map(p => ({
  value: p.code,
  label: p.label === 'Very Low' ? 'Très basse'
       : p.label === 'Low' ? 'Basse'
       : p.label === 'Medium' ? 'Moyenne'
       : p.label === 'High' ? 'Haute'
       : p.label === 'Very High' ? 'Très haute'
       : 'Majeure',
}));
