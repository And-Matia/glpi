import { SelectOption } from '@app/shared/ui/select/select.component';

const ITEM_STATUS_LABELS = [
  'En stock',
  'En production',
  'En panne',
  'Maintenance',
  'Hors service',
] as const;

export const ITEM_STATUS_OPTIONS: SelectOption[] = [
  { value: '', label: 'Tous les statuts' },
  ...ITEM_STATUS_LABELS.map(s => ({ value: s, label: s })),
];
