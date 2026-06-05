import { Injectable } from '@angular/core';
import { FieldMapSerializer, FieldDef } from './field-map.serializer';
import { TaxRule, TaxRuleListItem, TaxRuleWritable } from '../models/ps/tax-rule.model';
@Injectable({ providedIn: 'root' })
export class TaxRuleSerializer extends FieldMapSerializer<TaxRule, TaxRuleWritable, TaxRuleListItem> {
  protected readonly singularKey = 'tax_rule';
  protected readonly pluralKey = 'tax_rules';

  protected readonly fields: FieldDef[] = [
    { key: 'id', type: 'int', readOnly: true },
    { key: 'id_tax_rules_group', type: 'int' },
    { key: 'id_country', type: 'int' },
    { key: 'id_tax', type: 'int' },
    { key: 'id_state', type: 'falsyUndef' },
    { key: 'zipcode_from', type: 'falsyUndef' },
    { key: 'zipcode_to', type: 'falsyUndef' },
    { key: 'behavior', type: 'optionalInt' },
    { key: 'description', type: 'falsyUndef' },
  ];
}
