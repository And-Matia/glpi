import {
  Component,
  inject,
  signal,
  OnInit,
  ChangeDetectionStrategy,
  DestroyRef,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgOptimizedImage } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CartService, CartItem } from './cart.service';
import { StoreCheckoutService } from '../services/store-checkout.service';
import { UserSessionService } from '../services/user-session.service';
import { formatCurrency, formatDateISO } from '@app/core/utils';


@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,

  selector: 'app-cart',
  standalone: true,
  imports: [RouterLink, NgOptimizedImage],
  templateUrl: './cart.component.html',
  styleUrl: './cart.component.css',
})
export class CartComponent implements OnInit {
  readonly cartService = inject(CartService);
  private readonly checkout = inject(StoreCheckoutService);
  private readonly session = inject(UserSessionService);
  private readonly destroyRef = inject(DestroyRef);

  /** Most recent PrestaShop cart of the selected customer with resolved product data. */
  readonly lastCartData = signal<{ cart: any; lines: any[] } | null>(null);
  readonly lastCartLoading = signal(false);
  readonly loadingLast = signal(false);

  ngOnInit(): void {
    const user = this.session.currentUser();
    if (!user || user.id === 0) return; // anonymous — no PS cart

    this.lastCartLoading.set(true);
    this.checkout
      .getLastCart(user.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((data) => {
        this.lastCartData.set(data);
        this.lastCartLoading.set(false);
      });
  }

  lineHt(item: CartItem): number {
    return this.cartService.lineHt(item);
  }

  lineTtc(item: CartItem): number {
    return this.cartService.lineTtc(item);
  }

  unitHt(item: CartItem): number {
    return this.cartService.unitHt(item);
  }

  unitTtc(item: CartItem): number {
    return this.cartService.unitTtc(item);
  }

  lineTtcFromLine(line: { unitPrice: number; quantity: number; taxRate?: number }): number {
    return line.unitPrice * (1 + (line.taxRate || 0) / 100) * line.quantity;
  }

  dec(item: CartItem): void {
    this.cartService.setQuantity(item.product.id, item.combinationId, item.quantity - 1);
  }

  inc(item: CartItem): void {
    this.cartService.setQuantity(item.product.id, item.combinationId, item.quantity + 1);
  }

  remove(item: CartItem): void {
    this.cartService.remove(item.product.id, item.combinationId);
  }

  formatPrice(n: number): string {
    return formatCurrency(n, 2);
  }

  formatDateDisplay(iso: string): string {
    return formatDateISO(iso);
  }

  readonly deletingCart = signal(false);

  async deleteCart(): Promise<void> {
    if (this.deletingCart()) return;
    const ok = confirm('Supprimer définitivement ce panier ?');
    if (!ok) return;
    this.deletingCart.set(true);
    try {
      await this.cartService.deleteCart();
    } finally {
      this.deletingCart.set(false);
    }
  }

  async loadLastCart(): Promise<void> {
    const data = this.lastCartData();
    if (!data || this.loadingLast()) return;
    this.loadingLast.set(true);
    try {
      await this.cartService.adoptPsCart(data.cart.id);
    } finally {
      this.loadingLast.set(false);
    }
  }
}
