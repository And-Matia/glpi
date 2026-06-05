export type ImageEntityType =
  | 'general'
  | 'products'
  | 'categories'
  | 'manufacturers'
  | 'suppliers'
  | 'stores'
  | 'customizations';

export interface ImageListItem {
  id: number;
  href: string;
}

export interface ProductImage {
  id: number;
  id_product: number;
  position: number;
  cover: boolean;
  legend?: string;
}
