import { Injectable } from '@angular/core';
import { PsBaseApi } from './ps-base.api';

@Injectable({ providedIn: 'root' })
export class CartApi extends PsBaseApi {
  protected resource = 'carts';
}
