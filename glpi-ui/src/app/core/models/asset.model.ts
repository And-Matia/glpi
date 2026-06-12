export type ItemType = string;

export interface GlpiAsset {
  id: number;
  name: string;
  item_type: string;
  status: string;
  location: string;
  manufacturer: string;
  model: string;
  inventory_number: string;
  user: string;
}
