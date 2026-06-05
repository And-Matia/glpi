import { PsLang } from './ps-shared.model';

export interface CmsWritable {
  id_cms_category: number | null;
  position: number;
  indexation: boolean;
  active: boolean;
  meta_description: PsLang[];
  meta_keywords: PsLang[];
  meta_title: PsLang[];
  head_seo_title: PsLang[];
  link_rewrite: PsLang[];
  content: PsLang[];
}

export interface Cms extends CmsWritable {
  readonly id: number;
}

export interface CmsListItem {
  id: number;
  href: string;
}
