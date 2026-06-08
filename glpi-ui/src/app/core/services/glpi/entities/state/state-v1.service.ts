import { Injectable } from '@angular/core';
import { GlpiState } from '@app/core/models/glpi/entities/state.model';
import { BaseEntityV1Service } from '../base/base-entity-v1.service';

@Injectable({ providedIn: 'root' })
export class StateV1Service extends BaseEntityV1Service<GlpiState> {
  protected readonly endpoint = 'State';
}
