export interface TagWritable {
  id_lang: number;
  name: string;
}

export interface Tag extends TagWritable {
  readonly id: number;
}

export interface TagListItem {
  id: number;
  href: string;
}
