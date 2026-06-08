import type { Computer }           from './computer.model';
import type { Monitor }            from './monitor.model';
import type { Printer }            from './printer.model';
import type { Phone }              from './phone.model';
import type { Peripheral }         from './peripheral.model';
import type { NetworkEquipment }   from './network-equipment.model';
import type { Enclosure }          from './enclosure.model';
import type { Pdu }                from './pdu.model';
import type { PassiveDCEquipment } from './passive-dc-equipment.model';
import type { Rack }               from './rack.model';
import type { Cable }              from './cable.model';
import type { Appliance }          from './appliance.model';
import type { Certificate }        from './certificate.model';
import type { Socket }             from './socket.model';
import type { Software }           from './software.model';
import type { SoftwareLicense }    from './software-license.model';

export type AnyAsset =
  | Computer | Monitor | Printer | Phone | Peripheral
  | NetworkEquipment | Enclosure | Pdu | PassiveDCEquipment | Rack
  | Cable | Appliance | Certificate | Socket | Software | SoftwareLicense;
