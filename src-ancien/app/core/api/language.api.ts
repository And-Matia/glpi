import { Injectable } from '@angular/core';
import { PsBaseApi } from './ps-base.api';

@Injectable({ providedIn: 'root' })
export class LanguageApi extends PsBaseApi {
  protected resource = 'languages';
}
