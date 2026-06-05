import { Injectable } from '@angular/core';
import { PsBaseApi } from './ps-base.api';

@Injectable({ providedIn: 'root' })
export class ProductOptionApi extends PsBaseApi {
  protected resource = 'product_options';
}
