import { Injectable } from '@angular/core';
import { FieldMapSerializer, FieldDef } from './field-map.serializer';
import { StockMovement, StockMovementListItem, StockMovementWritable } from '../models/ps/stock-movement.model';
@Injectable({ providedIn: 'root' })
export class StockMovementSerializer extends FieldMapSerializer<
  StockMovement,
  StockMovementWritable,
  StockMovementListItem
> {
  protected readonly singularKey = 'stock_mvt';
  protected readonly pluralKey = 'stock_mvts';

  protected readonly fields: FieldDef[] = [
    { key: 'id', type: 'int', readOnly: true },
    { key: 'id_stock', type: 'int' },
    { key: 'id_stock_mvt_reason', type: 'int' },
    { key: 'id_employee', type: 'int' },
    { key: 'id_product', type: 'nullableInt' },
    { key: 'id_product_attribute', type: 'nullableInt' },
    { key: 'id_warehouse', type: 'nullableInt' },
    { key: 'id_currency', type: 'nullableInt' },
    { key: 'id_order', type: 'nullableInt' },
    { key: 'id_supply_order', type: 'nullableInt' },
    { key: 'management_type', type: 'string' },
    { key: 'product_name', type: 'lang' },
    { key: 'ean13', type: 'string' },
    { key: 'upc', type: 'string' },
    { key: 'reference', type: 'string' },
    { key: 'mpn', type: 'string' },
    { key: 'physical_quantity', type: 'int' },
    { key: 'sign', type: 'int' },
    { key: 'last_wa', type: 'string' },
    { key: 'current_wa', type: 'string' },
    { key: 'price_te', type: 'string' },
    { key: 'date_add', type: 'string' },
  ];
}
