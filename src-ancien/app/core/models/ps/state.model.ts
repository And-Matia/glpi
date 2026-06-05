export interface StateWritable {
  id_zone: number;
  id_country: number;
  iso_code: string;
  name: string;
  active: boolean;
}

export interface State extends StateWritable {
  readonly id: number;
}

export interface StateListItem {
  id: number;
  href: string;
}
