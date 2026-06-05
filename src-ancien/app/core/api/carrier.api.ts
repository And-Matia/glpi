import { Injectable } from '@angular/core';
import { PsBaseApi } from './ps-base.api';

@Injectable({ providedIn: 'root' })
export class CarrierApi extends PsBaseApi {
  protected resource = 'carriers';
}
