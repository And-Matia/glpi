import { Injectable } from '@angular/core';
import { PsBaseApi } from './ps-base.api';

@Injectable({ providedIn: 'root' })
export class ProductApi extends PsBaseApi {
  protected resource = 'products';
}
