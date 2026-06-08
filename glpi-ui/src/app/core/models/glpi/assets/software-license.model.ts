import { GlpiAsset } from './glpi-asset.model';

export interface SoftwareLicense extends GlpiAsset {
  item_type: 'SoftwareLicense';
  model: '';
}
