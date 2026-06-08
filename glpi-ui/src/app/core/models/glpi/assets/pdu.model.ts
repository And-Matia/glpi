import { GlpiAsset } from './glpi-asset.model';

export interface Pdu extends GlpiAsset {
  item_type: 'PDU';
}
