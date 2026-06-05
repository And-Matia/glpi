import { Injectable } from '@angular/core';
import { PsBaseApi } from './ps-base.api';

@Injectable({ providedIn: 'root' })
export class CountryApi extends PsBaseApi {
  protected resource = 'countries';
}
