import { PsLang } from './ps-shared.model';

export interface TaxWritable {
  rate: string;    // required
  name: PsLang[]; // required

  active?: boolean;
  deleted?: boolean;
}

export interface Tax extends TaxWritable {
  readonly id: number;
}

export interface TaxListItem {
  id: number;
  href: string;
}