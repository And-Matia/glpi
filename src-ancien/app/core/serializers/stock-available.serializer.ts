import { Injectable } from '@angular/core';
import { FieldMapSerializer, FieldDef } from './field-map.serializer';
import { StockAvailable, StockAvailableListItem, StockAvailableWritable } from '../models/ps/stock-available.model';
@Injectable({ providedIn: 'root' })
export class StockAvailableSerializer extends FieldMapSerializer<
  StockAvailable,
  StockAvailableWritable,
  StockAvailableListItem
> {
  protected readonly singularKey = 'stock_available';
  protected readonly pluralKey = 'stock_availables';

  protected readonly fields: FieldDef[] = [
    { key: 'id', type: 'int', readOnly: true },
    { key: 'id_product', type: 'int' },
    { key: 'id_product_attribute', type: 'int' },
    { key: 'quantity', type: 'int' },
    { key: 'depends_on_stock', type: 'bool' },
    { key: 'out_of_stock', type: 'int' },
    { key: 'id_shop', type: 'optionalInt' },
    { key: 'id_shop_group', type: 'optionalInt' },
    { key: 'location', type: 'optionalString' },
  ];
}
