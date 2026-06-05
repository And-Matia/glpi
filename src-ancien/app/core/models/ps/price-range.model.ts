export interface PriceRangeWritable {
  id_carrier: number;
  delimiter1: string;
  delimiter2: string;
}

export interface PriceRange extends PriceRangeWritable {
  readonly id: number;
}

export interface PriceRangeListItem {
  id: number;
  href: string;
}
