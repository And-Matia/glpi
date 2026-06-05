import { inject, Injectable } from '@angular/core';
import { CartApi } from '../api/cart.api';
import { Cart, CartListItem, CartWritable } from '../models/ps/cart.model';
import { CartSerializer } from '../serializers/cart.serializer';
import { PsBaseService } from './ps-base.service';

@Injectable({ providedIn: 'root' })
export class CartService extends PsBaseService<Cart, CartWritable, CartListItem> {
  protected api        = inject(CartApi);
  protected serializer = inject(CartSerializer);
}
