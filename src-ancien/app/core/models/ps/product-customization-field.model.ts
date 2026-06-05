import { PsLang } from './ps-shared.model';

export interface ProductCustomizationFieldWritable {
  id_product: number;
  type: number;
  required: boolean;
  is_module: boolean;
  is_deleted: boolean;
  name: PsLang[];
}

export interface ProductCustomizationField extends ProductCustomizationFieldWritable {
  readonly id: number;
}

export interface ProductCustomizationFieldListItem {
  id: number;
  href: string;
}
