import { Injectable } from '@angular/core';
import { PsBaseApi } from './ps-base.api';

@Injectable({ providedIn: 'root' })
export class CombinationApi extends PsBaseApi {
  protected resource = 'combinations';
}
