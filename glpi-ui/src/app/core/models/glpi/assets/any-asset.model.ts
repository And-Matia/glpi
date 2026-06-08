import type {
  Computer,
  Monitor,
  Printer,
  Phone,
  Peripheral,
  NetworkEquipment,
  Enclosure,
  PassiveDCEquipment,
  Appliance,
  Certificate,
  SoftwareLicense,
  Pdu,
  Rack,
  Cable,
  Socket,
  Software
} from '@app/core/models';

export type AnyAsset =
  | Computer | Monitor | Printer | Phone | Peripheral
  | NetworkEquipment | Enclosure | Pdu | PassiveDCEquipment | Rack
  | Cable | Appliance | Certificate | Socket | Software | SoftwareLicense;
