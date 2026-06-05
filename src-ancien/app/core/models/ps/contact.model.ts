import { PsLang } from './ps-shared.model';

export interface ContactWritable {
  email: string;
  customer_service: boolean;
  name: PsLang[];
  description: PsLang[];
}

export interface Contact extends ContactWritable {
  readonly id: number;
}

export interface ContactListItem {
  id: number;
  href: string;
}
