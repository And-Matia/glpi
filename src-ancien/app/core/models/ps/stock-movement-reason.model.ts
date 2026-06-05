import { PsLang } from './ps-shared.model';

export interface StockMovementReasonWritable {
  sign: string;
  deleted: boolean;
  date_add: string;
  date_upd: string;
  name: PsLang[];
}

export interface StockMovementReason extends StockMovementReasonWritable {
  readonly id: number;
}

export interface StockMovementReasonListItem {
  id: number;
  href: string;
}
