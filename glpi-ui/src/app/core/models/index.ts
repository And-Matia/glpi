export * from './ticket.model';
export * from './ticket-cost.model';
export * from './ticket-status.model';
export * from './import.model';
export * from './asset.model';
export * from './entity.model';
// Keep ItemType and Item aliases for backwards compat
export type { GlpiAsset as Item } from './asset.model';
export type ItemType = string;
