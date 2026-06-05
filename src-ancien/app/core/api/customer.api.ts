import { Injectable } from '@angular/core';
import { PsBaseApi } from './ps-base.api';

@Injectable({ providedIn: 'root' })
export class CustomerApi extends PsBaseApi {
  protected resource = 'customers';
}
