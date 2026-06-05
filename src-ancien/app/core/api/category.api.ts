import { Injectable } from '@angular/core';
import { PsBaseApi } from './ps-base.api';

@Injectable({ providedIn: 'root' })
export class CategoryApi extends PsBaseApi {
  protected resource = 'categories';
}
