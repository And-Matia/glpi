import { PsLang } from './ps-shared.model';

export interface SupplyOrderStateWritable {
  delivery_note: boolean;
  editable: boolean;
  receipt_state: boolean;
  pending_receipt: boolean;
  enclosed: boolean;
  color: string;
  name: PsLang[];
}

export interface SupplyOrderState extends SupplyOrderStateWritable {
  readonly id: number;
}

export interface SupplyOrderStateListItem {
  id: number;
  href: string;
}
