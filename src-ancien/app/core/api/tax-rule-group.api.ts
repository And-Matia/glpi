import { Injectable } from '@angular/core';
import { PsBaseApi } from './ps-base.api';

@Injectable({ providedIn: 'root' })
export class TaxRuleGroupApi extends PsBaseApi {
  protected resource = 'tax_rule_groups';
}

