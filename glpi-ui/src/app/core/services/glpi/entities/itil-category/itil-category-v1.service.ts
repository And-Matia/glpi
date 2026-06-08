import { Injectable } from '@angular/core';
import { GlpiITILCategory } from '@app/core/models/glpi/entities/itil-category.model';
import { BaseEntityV1Service } from '../base/base-entity-v1.service';

@Injectable({ providedIn: 'root' })
export class ITILCategoryV1Service extends BaseEntityV1Service<GlpiITILCategory> {
  protected readonly endpoint = 'ITILCategory';
}
