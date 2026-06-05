export interface WeightRangeWritable {
  id_carrier: number;
  delimiter1: string;
  delimiter2: string;
}

export interface WeightRange extends WeightRangeWritable {
  readonly id: number;
}

export interface WeightRangeListItem {
  id: number;
  href: string;
}
