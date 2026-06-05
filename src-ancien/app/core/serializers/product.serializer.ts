import { Injectable } from '@angular/core';
import { FieldMapSerializer, FieldDef } from './field-map.serializer';
import { Product, ProductListItem, ProductWritable } from '../models/ps/product.model';

@Injectable({ providedIn: 'root' })
export class ProductSerializer extends FieldMapSerializer<Product, ProductWritable, ProductListItem> {
  protected readonly singularKey = 'product';
  protected readonly pluralKey = 'products';

  protected readonly fields: FieldDef[] = [
    { key: 'id', type: 'int', readOnly: true },
    { key: 'manufacturer_name', type: 'string', readOnly: true },
    { key: 'quantity', type: 'int', readOnly: true },
    { key: 'price', type: 'stringZero' },
    { key: 'unit_price', type: 'stringZero' },
    { key: 'product_type', type: 'optionalString' },
    { key: 'id_manufacturer', type: 'nullableInt' },
    { key: 'id_supplier', type: 'nullableInt' },
    { key: 'id_default_image', type: 'nullableInt' },
    { key: 'id_default_combination', type: 'nullableInt' },
    { key: 'cache_default_attribute', type: 'nullableInt' },
    { key: 'position_in_category', type: 'nullableInt' },
    { key: 'low_stock_threshold', type: 'nullableInt' },
    { key: 'id_category_default', type: 'optionalInt' },
    { key: 'id_tax_rules_group', type: 'optionalInt' },
    { key: 'id_shop_default', type: 'optionalInt' },
    { key: 'state', type: 'optionalInt' },
    { key: 'pack_stock_type', type: 'optionalInt' },
    { key: 'minimal_quantity', type: 'optionalInt' },
    { key: 'customizable', type: 'optionalInt' },
    { key: 'text_fields', type: 'optionalInt' },
    { key: 'uploadable_files', type: 'optionalInt' },
    { key: 'additional_delivery_times', type: 'optionalInt' },
    { key: 'id_type_redirected', type: 'optionalInt' },
    { key: 'new', type: 'optionalBool' },
    { key: 'is_virtual', type: 'optionalBool' },
    { key: 'active', type: 'optionalBool' },
    { key: 'available_for_order', type: 'optionalBool' },
    { key: 'show_price', type: 'optionalBool' },
    { key: 'online_only', type: 'optionalBool' },
    { key: 'on_sale', type: 'optionalBool' },
    { key: 'show_condition', type: 'optionalBool' },
    { key: 'indexed', type: 'optionalBool' },
    { key: 'low_stock_alert', type: 'optionalBool' },
    { key: 'quantity_discount', type: 'optionalBool' },
    { key: 'advanced_stock_management', type: 'optionalBool' },
    { key: 'cache_is_pack', type: 'optionalBool' },
    { key: 'cache_has_attachments', type: 'optionalBool' },
    { key: 'reference', type: 'optionalString' },
    { key: 'supplier_reference', type: 'optionalString' },
    { key: 'ean13', type: 'optionalString' },
    { key: 'isbn', type: 'optionalString' },
    { key: 'upc', type: 'optionalString' },
    { key: 'mpn', type: 'optionalString' },
    { key: 'location', type: 'optionalString' },
    { key: 'width', type: 'optionalString' },
    { key: 'height', type: 'optionalString' },
    { key: 'depth', type: 'optionalString' },
    { key: 'weight', type: 'optionalString' },
    { key: 'wholesale_price', type: 'optionalString' },
    { key: 'ecotax', type: 'optionalString' },
    { key: 'unity', type: 'optionalString' },
    { key: 'unit_price_ratio', type: 'optionalString' },
    { key: 'additional_shipping_cost', type: 'optionalString' },
    { key: 'visibility', type: 'optionalString' },
    { key: 'condition', type: 'optionalString' },
    { key: 'redirect_type', type: 'optionalString' },
    { key: 'available_date', type: 'optionalString' },
    { key: 'date_add', type: 'optionalString' },
    { key: 'date_upd', type: 'optionalString' },
    { key: 'name', type: 'lang' },
    { key: 'description', type: 'lang' },
    { key: 'description_short', type: 'lang' },
    { key: 'meta_title', type: 'lang' },
    { key: 'meta_description', type: 'lang' },
    { key: 'meta_keywords', type: 'lang' },
    { key: 'link_rewrite', type: 'lang' },
    { key: 'available_now', type: 'lang' },
    { key: 'available_later', type: 'lang' },
    { key: 'delivery_in_stock', type: 'lang' },
    { key: 'delivery_out_stock', type: 'lang' },
  ];

  protected override mapToModel(raw: Record<string, unknown>): Product {
    const base = super.mapToModel(raw) as Product;
    const p = raw as any;
    return {
      ...base,
      product_type: p.product_type ?? p.type,
      associations: {
        categories: this.normalizeAssoc<{ id: string }>((raw['associations'] as any)?.categories, 'category').map(
          (x) => ({ id: this.toInt(x.id) }),
        ),
        images: this.normalizeAssoc<{ id: string }>((raw['associations'] as any)?.images, 'image').map((x) => ({
          id: this.toInt(x.id),
        })),
        combinations: this.normalizeAssoc<{ id: string }>(
          (raw['associations'] as any)?.combinations,
          'combination',
        ).map((x) => ({ id: this.toInt(x.id) })),
        product_option_values: this.normalizeAssoc<{ id: string }>(
          (raw['associations'] as any)?.product_option_values,
          'product_option_value',
        ).map((x) => ({ id: this.toInt(x.id) })),
        tags: this.normalizeAssoc<{ id: string }>((raw['associations'] as any)?.tags, 'tag').map((x) => ({
          id: this.toInt(x.id),
        })),
        attachments: this.normalizeAssoc<{ id: string }>(
          (raw['associations'] as any)?.attachments,
          'attachment',
        ).map((x) => ({ id: this.toInt(x.id) })),
        accessories: this.normalizeAssoc<{ id: string }>(
          (raw['associations'] as any)?.accessories,
          'accessory',
        ).map((x) => ({ id: this.toInt(x.id) })),
        product_features: this.normalizeAssoc<{ id: string; id_feature_value: string }>(
          (raw['associations'] as any)?.product_features,
          'product_feature',
        ).map((x) => ({ id: this.toInt(x.id), id_feature_value: this.toInt(x.id_feature_value) })),
        stock_availables: this.normalizeAssoc<{ id: string; id_product_attribute: string }>(
          (raw['associations'] as any)?.stock_availables,
          'stock_available',
        ).map((x) => ({
          id: this.toInt(x.id),
          id_product_attribute: this.toInt(x.id_product_attribute),
        })),
        product_bundle: this.normalizeAssoc<{
          id: string;
          id_product_attribute: string;
          quantity: string;
        }>((raw['associations'] as any)?.product_bundle, 'product_bundle_item').map((x) => ({
          id: this.toInt(x.id),
          id_product_attribute: this.toInt(x.id_product_attribute),
          quantity: this.toInt(x.quantity),
        })),
      },
    };
  }

  protected override mapToXml(p: ProductWritable): object {
    const r = super.mapToXml(p) as Record<string, any>;

    if (p.available_date !== undefined) {
      r['available_date'] = p.available_date ? String(p.available_date).substring(0, 10) : '';
    }

    if (p.associations?.categories !== undefined) {
      r['associations'] = {
        categories: { category: p.associations.categories.map((c) => ({ id: c.id })) },
      };
    }

    return r;
  }
}
