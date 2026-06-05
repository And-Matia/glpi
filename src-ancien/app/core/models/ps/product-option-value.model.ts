import { PsLang } from './ps-shared.model';

export interface ProductOptionValueWritable {
  id_attribute_group: number;
  color?: string;
  position?: number;
  name: PsLang[];
}

export interface ProductOptionValue extends ProductOptionValueWritable {
  readonly id: number;
}

export interface ProductOptionValueListItem {
  id: number;
  href: string;
}
