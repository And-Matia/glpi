import { Injectable } from '@angular/core';
import { PsBaseApi } from './ps-base.api';

@Injectable({ providedIn: 'root' })
export class SupplierApi extends PsBaseApi {
  protected resource = 'suppliers';
}
