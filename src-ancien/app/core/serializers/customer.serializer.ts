import { Injectable } from '@angular/core';
import { FieldMapSerializer, FieldDef } from './field-map.serializer';
import { Customer, CustomerListItem, CustomerWritable } from '../models/ps/customer.model';
@Injectable({ providedIn: 'root' })
export class CustomerSerializer extends FieldMapSerializer<
  Customer,
  CustomerWritable,
  CustomerListItem
> {
  protected readonly singularKey = 'customer';
  protected readonly pluralKey = 'customers';

  protected readonly fields: FieldDef[] = [
    { key: 'id', type: 'int', readOnly: true },
    { key: 'secure_key', type: 'optionalString', readOnly: true },
    { key: 'last_passwd_gen', type: 'optionalString', readOnly: true },
    { key: 'passwd', type: 'optionalString' },
    { key: 'lastname', type: 'optionalString' },
    { key: 'firstname', type: 'optionalString' },
    { key: 'email', type: 'optionalString' },
    { key: 'id_gender', type: 'optionalInt' },
    { key: 'id_default_group', type: 'optionalInt' },
    { key: 'id_lang', type: 'optionalInt' },
    { key: 'id_shop', type: 'optionalInt' },
    { key: 'id_shop_group', type: 'optionalInt' },
    { key: 'id_risk', type: 'optionalInt' },
    { key: 'birthday', type: 'optionalString' },
    { key: 'website', type: 'optionalString' },
    { key: 'company', type: 'optionalString' },
    { key: 'siret', type: 'optionalString' },
    { key: 'ape', type: 'optionalString' },
    { key: 'outstanding_allow_amount', type: 'optionalString' },
    { key: 'max_payment_days', type: 'optionalInt' },
    { key: 'newsletter', type: 'optionalBool' },
    { key: 'optin', type: 'optionalBool' },
    { key: 'newsletter_date_add', type: 'optionalString' },
    { key: 'ip_registration_newsletter', type: 'optionalString' },
    { key: 'active', type: 'optionalBool' },
    { key: 'deleted', type: 'optionalBool' },
    { key: 'is_guest', type: 'optionalBool' },
    { key: 'note', type: 'optionalString' },
    { key: 'show_public_prices', type: 'optionalBool' },
    { key: 'date_add', type: 'optionalString' },
    { key: 'date_upd', type: 'optionalString' },
    { key: 'reset_password_token', type: 'optionalString' },
    { key: 'reset_password_validity', type: 'optionalString' },
  ];

  protected override mapToModel(c: Record<string, unknown>): Customer {
    const base = super.mapToModel(c) as Customer;
    return {
      ...base,
      associations: {
        groups: this.normalizeAssoc<{ id: string }>(
          (c['associations'] as any)?.groups,
          'group',
        ).map((x) => ({
          id: this.toInt(x.id),
        })),
      },
    };
  }

  protected override mapToXml(c: CustomerWritable): object {
    const result = super.mapToXml(c) as Record<string, any>;

    if (c.associations !== undefined) {
      result['associations'] = {};
      if (c.associations.groups !== undefined) {
        (result['associations'] as any).groups = {
          group: c.associations.groups.map((x) => ({ id: x.id })),
        };
      }
    }

    return result;
  }
}
