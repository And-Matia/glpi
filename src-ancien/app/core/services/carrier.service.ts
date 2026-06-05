import { inject, Injectable } from '@angular/core';
import { CarrierApi } from '@app/core/api/carrier.api';
import { Carrier, CarrierListItem, CarrierWritable } from '../models/ps/carrier.model';
import { CarrierSerializer } from '../serializers/carrier.serializer';
import { PsBaseService } from './ps-base.service';

@Injectable({ providedIn: 'root' })
export class CarrierService extends PsBaseService<Carrier, CarrierWritable, CarrierListItem> {
  protected api        = inject(CarrierApi);
  protected serializer = inject(CarrierSerializer);
}
