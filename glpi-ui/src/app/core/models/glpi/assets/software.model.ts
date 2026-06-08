import { GlpiAsset } from '@app/core/models';

export interface Software extends GlpiAsset {
  item_type: 'Software';
  model: '';
}
