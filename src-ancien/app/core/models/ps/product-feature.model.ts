import { PsLang } from './ps-shared.model';

export interface ProductFeatureWritable {
  position: number;
  name: PsLang[];
}

export interface ProductFeature extends ProductFeatureWritable {
  readonly id: number;
}

export interface ProductFeatureListItem {
  id: number;
  href: string;
}
