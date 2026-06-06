/**
 * A GLPI asset itemtype (e.g. "Computer", "Monitor", "Printer"…).
 * The supported set is defined centrally in `ASSET_TYPES`
 * (see core/constants/glpi.constants.ts).
 */
export type ItemType = string;

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
