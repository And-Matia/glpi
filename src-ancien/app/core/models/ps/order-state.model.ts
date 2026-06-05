import { PsLang } from './ps-shared.model';

export interface OrderStateWritable {
  unremovable: boolean;
  delivery: boolean;
  hidden: boolean;
  send_email: boolean;
  invoice: boolean;
  logable: boolean;
  shipped: boolean;
  paid: boolean;
  pdf_delivery: boolean;
  pdf_invoice: boolean;
  deleted: boolean;
  color: string;
  module_name: string;
  name: PsLang[];
  template: PsLang[];
}

export interface OrderState extends OrderStateWritable {
  readonly id: number;
}

export interface OrderStateListItem {
  id: number;
  href: string;
}
