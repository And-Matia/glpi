import { Injectable } from '@angular/core';
import { PsBaseApi } from './ps-base.api';

@Injectable({ providedIn: 'root' })
export class StockMovementApi extends PsBaseApi {
  protected resource = 'stock_movements';
}
