import { inject, Injectable } from '@angular/core';
import { StockMovementReasonApi } from '@app/core/api/stock-movement-reason.api';
import { StockMovementReason, StockMovementReasonListItem, StockMovementReasonWritable } from '../models/ps/stock-movement-reason.model';
import { StockMovementReasonSerializer } from '../serializers/stock-movement-reason.serializer';
import { PsBaseService } from './ps-base.service';

@Injectable({ providedIn: 'root' })
export class StockMovementReasonService extends PsBaseService<
  StockMovementReason,
  StockMovementReasonWritable,
  StockMovementReasonListItem
> {
  protected api        = inject(StockMovementReasonApi);
  protected serializer = inject(StockMovementReasonSerializer);
}
