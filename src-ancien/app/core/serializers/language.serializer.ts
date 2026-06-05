import { Injectable } from '@angular/core';
import { FieldMapSerializer, FieldDef } from './field-map.serializer';
import { Language, LanguageListItem, LanguageWritable } from '../models/ps/language.model';
@Injectable({ providedIn: 'root' })
export class LanguageSerializer extends FieldMapSerializer<Language, LanguageWritable, LanguageListItem> {
  protected readonly singularKey = 'language';
  protected readonly pluralKey = 'languages';

  protected readonly fields: FieldDef[] = [
    { key: 'id', type: 'int', readOnly: true },
    { key: 'name', type: 'string' },
    { key: 'iso_code', type: 'string' },
    { key: 'locale', type: 'string' },
    { key: 'language_code', type: 'string' },
    { key: 'date_format_lite', type: 'string' },
    { key: 'date_format_full', type: 'string' },
    { key: 'active', type: 'bool' },
    { key: 'is_rtl', type: 'bool' },
  ];
}
