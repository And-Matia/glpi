import { Injectable } from '@angular/core';
import { PsBaseApi } from './ps-base.api';

@Injectable({ providedIn: 'root' })
export class AddressApi extends PsBaseApi {
  protected resource = 'addresses';
}
