import { Injectable } from '@angular/core';
import { FieldMapSerializer, FieldDef } from './field-map.serializer';
import { StockMovementReason, StockMovementReasonListItem, StockMovementReasonWritable } from '../models/ps/stock-movement-reason.model';
@Injectable({ providedIn: 'root' })
export class StockMovementReasonSerializer extends FieldMapSerializer<StockMovementReason, StockMovementReasonWritable, StockMovementReasonListItem> {
  protected readonly singularKey = 'stock_mvt_reason';
  protected readonly pluralKey = 'stock_mvt_reasons';

  protected readonly fields: FieldDef[] = [
    { key: 'id', type: 'int', readOnly: true },
    { key: 'sign', type: 'string' },
    { key: 'date_add', type: 'string' },
    { key: 'date_upd', type: 'string' },
    { key: 'deleted', type: 'bool' },
    { key: 'name', type: 'lang' },
  ];

}
