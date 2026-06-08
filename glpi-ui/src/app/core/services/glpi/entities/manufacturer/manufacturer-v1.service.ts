import { Injectable } from '@angular/core';
import { GlpiManufacturer } from '@app/core/models/glpi/entities/manufacturer.model';
import { BaseEntityV1Service } from '../base/base-entity-v1.service';

@Injectable({ providedIn: 'root' })
export class ManufacturerV1Service extends BaseEntityV1Service<GlpiManufacturer> {
  protected readonly endpoint = 'Manufacturer';
}
