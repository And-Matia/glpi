import { inject, Injectable } from '@angular/core';
import { LanguageApi } from '@app/core/api/language.api';
import { Language, LanguageListItem, LanguageWritable } from '../models/ps/language.model';
import { LanguageSerializer } from '../serializers/language.serializer';
import { PsBaseService } from './ps-base.service';

@Injectable({ providedIn: 'root' })
export class LanguageService extends PsBaseService<Language, LanguageWritable, LanguageListItem> {
  protected api        = inject(LanguageApi);
  protected serializer = inject(LanguageSerializer);
}
