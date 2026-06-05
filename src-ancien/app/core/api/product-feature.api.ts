import { Injectable } from '@angular/core';
import { PsBaseApi } from './ps-base.api';

@Injectable({ providedIn: 'root' })
export class ProductFeatureApi extends PsBaseApi {
  protected resource = 'product_features';
}
