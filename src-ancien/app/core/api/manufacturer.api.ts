import { Injectable } from '@angular/core';
import { PsBaseApi } from './ps-base.api';

@Injectable({ providedIn: 'root' })
export class ManufacturerApi extends PsBaseApi {
  protected resource = 'manufacturers';
}
