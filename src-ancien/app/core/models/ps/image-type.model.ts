export interface ImageTypeWritable {
  name: string;
  width: number;
  height: number;
  categories: boolean;
  products: boolean;
  manufacturers: boolean;
  suppliers: boolean;
  stores: boolean;
}

export interface ImageType extends ImageTypeWritable {
  readonly id: number;
}

export interface ImageTypeListItem {
  id: number;
  href: string;
}
