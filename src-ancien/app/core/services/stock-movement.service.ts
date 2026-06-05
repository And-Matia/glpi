import { inject, Injectable } from '@angular/core';
import { StockMovementApi } from '@app/core/api/stock-movement.api';
import { StockMovement, StockMovementListItem, StockMovementWritable } from '../models/ps/stock-movement.model';
import { StockMovementSerializer } from '../serializers/stock-movement.serializer';
import { PsBaseService } from './ps-base.service';

@Injectable({ providedIn: 'root' })
export class StockMovementService extends PsBaseService<
  StockMovement,
  StockMovementWritable,
  StockMovementListItem
> {
  protected api        = inject(StockMovementApi);
  protected serializer = inject(StockMovementSerializer);
}
