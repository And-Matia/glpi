import { GlpiAsset } from './glpi-asset.model';

export interface Computer extends GlpiAsset {
  item_type: 'Computer';
}
