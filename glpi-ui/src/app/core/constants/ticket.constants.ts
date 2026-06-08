import { SelectOption } from '@app/shared/ui/select/select.component';

// Re-export everything so existing imports from this path keep working.
export { GLPI_TICKET_STATUS, GLPI_TICKET_PRIORITY, GLPI_TICKET_TYPE, TICKET_TYPE_CODE, TICKET_STATUS_CODE, TICKET_PRIORITY_CODE } from '@app/core/models/ticket.model';

export const TICKET_TYPE_OPTIONS: SelectOption[] = [
  { value: 1, label: 'Incident' },
  { value: 2, label: 'Demande' },
];

export const TICKET_PRIORITY_OPTIONS: SelectOption[] = [
  { value: 1, label: 'Très basse' },
  { value: 2, label: 'Basse' },
  { value: 3, label: 'Moyenne' },
  { value: 4, label: 'Haute' },
  { value: 5, label: 'Très haute' },
  { value: 6, label: 'Majeure' },
];
