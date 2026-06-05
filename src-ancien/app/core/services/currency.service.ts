import { inject, Injectable } from '@angular/core';
import { CurrencyApi } from '@app/core/api/currency.api';
import { Currency, CurrencyListItem, CurrencyWritable } from '../models/ps/currency.model';
import { CurrencySerializer } from '../serializers/currency.serializer';
import { PsBaseService } from './ps-base.service';

@Injectable({ providedIn: 'root' })
export class CurrencyService extends PsBaseService<Currency, CurrencyWritable, CurrencyListItem> {
  protected api        = inject(CurrencyApi);
  protected serializer = inject(CurrencySerializer);
}
