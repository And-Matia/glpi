import { Injectable } from '@angular/core';
import { PsBaseApi } from './ps-base.api';

@Injectable({ providedIn: 'root' })
export class CurrencyApi extends PsBaseApi {
  protected resource = 'currencies';
}
