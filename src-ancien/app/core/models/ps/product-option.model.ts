import { PsLang } from './ps-shared.model';

export interface ProductOptionWritable {
  is_color_group?: boolean;
  group_type: string;
  position?: number;
  name: PsLang[];
  public_name: PsLang[];
  associations?: {
    product_option_values: { id: number }[];
  };
}

export interface ProductOption extends ProductOptionWritable {
  readonly id: number;
}

export interface ProductOptionListItem {
  id: number;
  href: string;
}
