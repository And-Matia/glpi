export interface ZoneWritable {
  name: string;
  active: boolean;
}

export interface Zone extends ZoneWritable {
  readonly id: number;
}

export interface ZoneListItem {
  id: number;
  href: string;
}
