import { Injectable } from '@angular/core';
import { PsBaseApi } from './ps-base.api';

@Injectable({ providedIn: 'root' })
export class TaxApi extends PsBaseApi {
  protected resource = 'taxes';
}
