export type ItemType = 'Computer' | 'Monitor';

export interface Item {
  id: number;
  name: string;
  status: string;
  location: string;
  manufacturer: string;
  item_type: ItemType;
  model: string;
  inventory_number: string;
  user: string;
}
