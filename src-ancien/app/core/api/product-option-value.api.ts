import { Injectable } from '@angular/core';
import { PsBaseApi } from './ps-base.api';

@Injectable({ providedIn: 'root' })
export class ProductOptionValueApi extends PsBaseApi {
  protected resource = 'product_option_values';
}
