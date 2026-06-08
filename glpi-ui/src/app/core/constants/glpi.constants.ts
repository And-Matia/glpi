import { SelectOption } from '@app/shared/ui/select/select.component';
import { ASSET_TYPES } from '@app/core/models/glpi/assets/glpi-asset.model';

// Re-export everything so existing imports from this path keep working.
export type { AssetTypeConfig } from '@app/core/models/glpi/assets/glpi-asset.model';
export { ASSET_TYPES, ASSET_ITEMTYPES, ASSET_API_TYPES, assetType, assetLabel, apiTypeOf } from '@app/core/models/glpi/assets/glpi-asset.model';

export const ASSET_TYPE_OPTIONS: SelectOption[] = [
  { value: '', label: 'Tous les types' },
  ...ASSET_TYPES.map(a => ({ value: a.itemtype, label: a.label })),
];
