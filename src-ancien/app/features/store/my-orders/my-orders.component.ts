import {
  Component,
  OnInit,
  inject,
  signal,
  ChangeDetectionStrategy,
  DestroyRef,
} from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { StoreCheckoutService } from '../services/store-checkout.service';
import { UserSessionService } from '../services/user-session.service';
import { Order } from '@app/core/models';
import { formatCurrency, formatDateISO } from '@app/core/utils';
import { getOrderStateName } from '@app/core/constants';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,

  selector: 'app-my-orders',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './my-orders.component.html',
  styleUrl: './my-orders.component.css',
})
export class MyOrdersComponent implements OnInit {
  private readonly checkout = inject(StoreCheckoutService);
  private readonly session = inject(UserSessionService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly orders = signal<Order[]>([]);
  readonly loading = signal(true);
  readonly multipliers = signal<Record<number, number>>({});

  ngOnInit(): void {
    const userId = this.session.currentUser()?.id ?? 0;
    this.checkout
      .getOrdersByCustomerFull(userId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((orders) => {
        this.orders.set(orders);
        this.loading.set(false);
      });
  }

  itemsSummary(order: Order): string {
    const rows = order.associations?.order_rows ?? [];
    return rows.map((r) => `${r.product_name} ×${r.product_quantity}`).join(', ');
  }

  formatPrice(n: number): string {
    return formatCurrency(n, 2);
  }

  formatOrderDate(iso: string): string {
    return formatDateISO(iso);
  }

  getOrderStatus(state: number): { label: string; key: string } {
    const label = getOrderStateName(state);
    let key: 'paid' | 'pending' | 'cancelled' = 'pending';
    if (state === 8) key = 'paid';
    else if (state === 6) key = 'cancelled';
    return { label, key };
  }

  duplicateOrder(order: Order): void {
    const multiplier = this.multipliers()[order.id] || 1;
    void this.router.navigate(['/duplicate-order', order.id], {
      queryParams: { multiplier },
    });
  }

  setMultiplier(orderId: number, event: Event): void {
    const value = (event.target as HTMLInputElement)?.value ?? '';
    const num = parseInt(value, 10);
    if (!isNaN(num) && num > 0) {
      this.multipliers.update(m => ({ ...m, [orderId]: num }));
    }
  }

  parseFloat(value: string | number): number {
    return parseFloat(String(value)) || 0;
  }
}
