import { Injectable } from '@angular/core';
import { PsBaseApi } from './ps-base.api';

@Injectable({ providedIn: 'root' })
export class StockMovementReasonApi extends PsBaseApi {
  protected resource = 'stock_movement_reasons';
}
