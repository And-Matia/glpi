import { inject, Injectable } from '@angular/core';
import { CountryApi } from '@app/core/api/country.api';
import { Country, CountryListItem, CountryWritable } from '../models/ps/country.model';
import { CountrySerializer } from '../serializers/country.serializer';
import { PsBaseService } from './ps-base.service';

@Injectable({ providedIn: 'root' })
export class CountryService extends PsBaseService<Country, CountryWritable, CountryListItem> {
  protected api        = inject(CountryApi);
  protected serializer = inject(CountrySerializer);
}
