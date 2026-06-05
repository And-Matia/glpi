import { Injectable } from '@angular/core';
import { FieldMapSerializer, FieldDef } from './field-map.serializer';
import { TaxRuleGroup, TaxRuleGroupListItem, TaxRuleGroupWritable } from '../models/ps/tax-rule-group.model';
@Injectable({ providedIn: 'root' })
export class TaxRuleGroupSerializer extends FieldMapSerializer<TaxRuleGroup, TaxRuleGroupWritable, TaxRuleGroupListItem> {
  protected readonly singularKey = 'tax_rule_group';
  protected readonly pluralKey = 'tax_rule_groups';

  protected readonly fields: FieldDef[] = [
    { key: 'id', type: 'int', readOnly: true },
    { key: 'name', type: 'string' },
    { key: 'active', type: 'optionalBool' },
    { key: 'deleted', type: 'optionalBool' },
    { key: 'date_add', type: 'optionalString' },
    { key: 'date_upd', type: 'optionalString' },
  ];
}
