import { SelectOption } from '@app/shared/ui/select/select.component';

export const GLPI_TICKET_STATUS: Record<number, string> = {
  1: 'New',
  2: 'Processing (assigned)',
  3: 'Processing (planned)',
  4: 'Pending',
  5: 'Solved',
  6: 'Closed',
};

export const GLPI_TICKET_PRIORITY: Record<number, string> = {
  1: 'Very Low',
  2: 'Low',
  3: 'Medium',
  4: 'High',
  5: 'Very High',
  6: 'Major',
};

export const GLPI_TICKET_TYPE: Record<number, string> = {
  1: 'Incident',
  2: 'Request',
};

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

export const TICKET_TYPE_CODE: Record<string, number> = {
  Incident: 1,
  Request:  2,
  Demande:  2,
};

export const TICKET_STATUS_CODE: Record<string, number> = {
  'New':                    1,
  'Processing (assigned)':  2,
  'Processing (planned)':   3,
  'Pending':                4,
  'Solved':                 5,
  'Closed':                 6,
};

export const TICKET_PRIORITY_CODE: Record<string, number> = {
  'Very Low':  1,
  'Low':       2,
  'Medium':    3,
  'High':      4,
  'Very High': 5,
  'Major':     6,
};
