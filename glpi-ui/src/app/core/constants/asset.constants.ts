import { SelectOption } from '@app/shared/ui/select/select.component';

export interface AssetTypeConfig {
  itemtype: string;
  apiType: string;
  label: string;
  v2Path: string;
  modelType?: string;
  modelField?: string;
}

export const ASSET_TYPES: AssetTypeConfig[] = [
  { itemtype: 'Computer', apiType: 'Computer', label: 'Ordinateur', v2Path: 'Assets/Computer', modelType: 'ComputerModel', modelField: 'computermodels_id' },
  { itemtype: 'Monitor', apiType: 'Monitor', label: 'Moniteur', v2Path: 'Assets/Monitor', modelType: 'MonitorModel', modelField: 'monitormodels_id' },
  { itemtype: 'Phone', apiType: 'Phone', label: 'Téléphone', v2Path: 'Assets/Phone', modelType: 'PhoneModel', modelField: 'phonemodels_id' },
  // { itemtype: 'Printer', apiType: 'Printer', label: 'Imprimante', v2Path: 'Assets/Printer', modelType: 'PrinterModel', modelField: 'printermodels_id' },
  // { itemtype: 'Peripheral', apiType: 'Peripheral', label: 'Périphérique', v2Path: 'Assets/Peripheral', modelType: 'PeripheralModel', modelField: 'peripheralmodels_id' },
  // { itemtype: 'NetworkEquipment', apiType: 'NetworkEquipment', label: 'Équipement réseau', v2Path: 'Assets/NetworkEquipment', modelType: 'NetworkEquipmentModel', modelField: 'networkequipmentmodels_id' },
  // { itemtype: 'Enclosure', apiType: 'Enclosure', label: 'Enclosure', v2Path: 'Assets/Enclosure', modelType: 'EnclosureModel', modelField: 'enclosuremodels_id' },
  // { itemtype: 'PDU', apiType: 'PDU', label: 'PDU', v2Path: 'Assets/PDU', modelType: 'PDUModel', modelField: 'pdumodels_id' },
  // { itemtype: 'PassiveDCEquipment', apiType: 'PassiveDCEquipment', label: 'PassiveDCEquipment', v2Path: 'Assets/PassiveDCEquipment', modelType: 'PassiveDCEquipmentModel', modelField: 'passivedcequipmentmodels_id' },
  // { itemtype: 'Rack', apiType: 'Rack', label: 'Rack', v2Path: 'Assets/Rack', modelType: 'RackModel', modelField: 'rackmodels_id' },
  // { itemtype: 'Cable', apiType: 'Cable', label: 'Cable', v2Path: 'Assets/Cable', modelType: 'CableType', modelField: 'cabletypes_id' },
  // { itemtype: 'Appliance', apiType: 'Appliance', label: 'Appliance', v2Path: 'Assets/Appliance', modelType: 'ApplianceType', modelField: 'appliancetypes_id' },
  // { itemtype: 'Certificate', apiType: 'Certificate', label: 'Certificate', v2Path: 'Assets/Certificate', modelType: 'CertificateType', modelField: 'certificatetypes_id' },
  // { itemtype: 'Socket', apiType: 'Glpi\\Socket', label: 'Socket', v2Path: 'Assets/Socket', modelType: 'Glpi\\SocketModel', modelField: 'socketmodels_id' },
  // { itemtype: 'Software', apiType: 'Software', label: 'Logiciel', v2Path: 'Assets/Software' },
  // { itemtype: 'SoftwareLicense', apiType: 'SoftwareLicense', label: 'SoftwareLicense', v2Path: 'Assets/SoftwareLicense' },
];

export const ASSET_ITEMTYPES: string[] = ASSET_TYPES.map(a => a.itemtype);
export const ASSET_API_TYPES: string[] = ASSET_TYPES.map(a => a.apiType);

export function assetType(itemtype: string): AssetTypeConfig | undefined {
  return ASSET_TYPES.find(a => a.itemtype === itemtype);
}

export function assetLabel(itemtype: string): string {
  return assetType(itemtype)?.label ?? itemtype;
}

export function apiTypeOf(itemtype: string): string {
  return assetType(itemtype)?.apiType ?? itemtype;
}

export const ASSET_TYPE_OPTIONS: SelectOption[] = [
  { value: '', label: 'Tous les types' },
  ...ASSET_TYPES.map(a => ({ value: a.itemtype, label: a.label })),
];

const ITEM_STATUS_LABELS = [
  'En stock',
  'En production',
  'En panne',
  'Maintenance',
  'Hors service',
] as const;

export const ITEM_STATUS_OPTIONS: SelectOption[] = [
  { value: '', label: 'Tous les statuts' },
  ...ITEM_STATUS_LABELS.map(s => ({ value: s, label: s })),
];
