import { GlpiAsset } from './glpi-asset.model';

export interface Software extends GlpiAsset {
  item_type: 'Software';
  model: '';
}
