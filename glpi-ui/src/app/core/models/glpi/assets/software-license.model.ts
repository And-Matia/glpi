import { GlpiAsset } from '@app/core/models';

export interface SoftwareLicense extends GlpiAsset {
  item_type: 'SoftwareLicense';
  model: '';
}
