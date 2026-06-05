import { PsLang } from './ps-shared.model';

export interface ProductFeatureValueWritable {
  id_feature: number;
  custom: boolean;
  value: PsLang[];
}

export interface ProductFeatureValue extends ProductFeatureValueWritable {
  readonly id: number;
}

export interface ProductFeatureValueListItem {
  id: number;
  href: string;
}
