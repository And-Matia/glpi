import { Injectable } from '@angular/core';
import { PsBaseApi } from './ps-base.api';

@Injectable({ providedIn: 'root' })
export class TaxRuleApi extends PsBaseApi {
  protected resource = 'tax_rules';
}
