import { Injectable } from '@angular/core';
import { GlpiLocation } from '@app/core/models/glpi/entities/location.model';
import { BaseEntityV1Service } from '../base/base-entity-v1.service';

@Injectable({ providedIn: 'root' })
export class LocationV1Service extends BaseEntityV1Service<GlpiLocation> {
  protected readonly endpoint = 'Location';
}
