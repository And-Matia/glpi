import { Injectable } from '@angular/core';
import { FieldMapSerializer, FieldDef } from './field-map.serializer';
import { Category, CategoryListItem, CategoryWritable } from '../models/ps/category.model';
@Injectable({ providedIn: 'root' })
export class CategorySerializer extends FieldMapSerializer<Category, CategoryWritable, CategoryListItem> {
  protected readonly singularKey = 'category';
  protected readonly pluralKey = 'categories';

  protected readonly fields: FieldDef[] = [
    { key: 'id', type: 'int', readOnly: true },
    { key: 'level_depth', type: 'int', readOnly: true },
    { key: 'nb_products_recursive', type: 'int', readOnly: true },
    { key: 'active', type: 'bool' },
    { key: 'name', type: 'lang' },
    { key: 'link_rewrite', type: 'lang' },
    { key: 'description', type: 'lang' },
    { key: 'meta_title', type: 'lang' },
    { key: 'meta_description', type: 'lang' },
    { key: 'meta_keywords', type: 'lang' },
    { key: 'id_parent', type: 'optionalInt' },
    { key: 'id_shop_default', type: 'optionalInt' },
    { key: 'position', type: 'optionalInt' },
    { key: 'is_root_category', type: 'optionalBool' },
    { key: 'date_add', type: 'optionalString' },
    { key: 'date_upd', type: 'optionalString' },
  ];

  protected override mapToModel(raw: Record<string, unknown>): Category {
    const base = super.mapToModel(raw) as Category;
    return {
      ...base,
      associations: {
        categories: this.normalizeAssoc<{ id: string }>((raw['associations'] as any)?.categories, 'category').map((x) => ({
          id: this.toInt(x.id),
        })),
        products: this.normalizeAssoc<{ id: string }>((raw['associations'] as any)?.products, 'product').map((x) => ({
          id: this.toInt(x.id),
        })),
      },
    };
  }

  protected override mapToXml(data: CategoryWritable): object {
    const result = super.mapToXml(data) as Record<string, any>;
    if (data.associations) {
      result['associations'] = {};
      if (data.associations.categories?.length) {
        (result['associations'] as any).categories = {
          category: data.associations.categories.map((x) => ({ id: x.id })),
        };
      }
      if (data.associations.products?.length) {
        (result['associations'] as any).products = {
          product: data.associations.products.map((x) => ({ id: x.id })),
        };
      }
    }
    return result;
  }
}

