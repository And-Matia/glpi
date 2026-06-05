import { Injectable } from '@angular/core';
import { FieldMapSerializer, FieldDef } from './field-map.serializer';
import { OrderTransition, OrderTransitionListItem, OrderTransitionWritable } from '@app/core/models/ps/order-transition.model';

/**
 * Serializer for the psorderapi module endpoint
 * Wraps the order_state inside order_states (plural) as expected by the module
 */
@Injectable({ providedIn: 'root' })
export class OrderTransitionModuleSerializer extends FieldMapSerializer<OrderTransition, OrderTransitionWritable, OrderTransitionListItem> {
  protected readonly singularKey = 'order_state';
  protected readonly pluralKey = 'order_states';

  protected readonly fields: FieldDef[] = [
    { key: 'id', type: 'int', readOnly: true },
    { key: 'id_order', type: 'int' },
    { key: 'id_order_state', type: 'int' },
    { key: 'date_add', type: 'optionalString' },
  ];

  // Module endpoint expects: <prestashop><order_states><order_state>...</order_state></order_states></prestashop>
  override serializeForWrite(data: OrderTransitionWritable): string {
    return this.s.toXml({ prestashop: { [this.pluralKey]: { [this.singularKey]: this.mapToXml(data) } } });
  }

  override serializeForUpdate(id: number, data: OrderTransitionWritable): string {
    return this.s.toXml({ prestashop: { [this.pluralKey]: { [this.singularKey]: { id, ...this.mapToXml(data) } } } });
  }

  override parseOne(xml: string): OrderTransition {
    // The module returns <prestashop><order_states><order_state>...</order_state></order_states></prestashop>
    const root = this.s.fromXml(xml) as any;
    const raw = root?.prestashop?.[this.pluralKey]?.[this.singularKey];

    if (!raw) {
      const single = root?.prestashop?.[this.singularKey];
      if (single) return this.mapToModel(single);
      throw new Error(`${this.constructor.name}.parseOne: missing <${this.singularKey}> in PS response — snippet: ${xml.slice(0, 400)}`);
    }

    const item = Array.isArray(raw) ? raw[0] : raw;
    return this.mapToModel(item);
  }
}


