import {
  Component,
  OnInit,
  inject,
  signal,
  ChangeDetectionStrategy,
  DestroyRef,
} from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { StoreCheckoutService } from '../services/store-checkout.service';
import { Order } from '@app/core/models';
import { getOrderStateName } from '@app/core/constants';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,

  selector: 'app-order-confirmation',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './order-confirmation.component.html',
  styleUrl: './order-confirmation.component.css',
})
export class OrderConfirmationComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly checkout = inject(StoreCheckoutService);
  private readonly destroyRef = inject(DestroyRef);

  readonly order = signal<Order | null>(null);
  readonly loading = signal(true);

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!id) {
      this.loading.set(false);
      return;
    }
    this.checkout
      .getOrder(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((order) => {
        this.order.set(order);
        this.loading.set(false);
      });
  }

  getStatusLabel(order: Order): string {
    return getOrderStateName(order.current_state ?? 0);
  }

  getOrderItems(order: Order) {
    return order.associations?.order_rows ?? [];
  }

  getTotal(order: Order): number {
    return parseFloat(order.total_paid || '0') || 0;
  }

  getTotalHt(order: Order): number {
    return parseFloat(order.total_paid_tax_excl || order.total_paid || '0') || 0;
  }

  getTotalTtc(order: Order): number {
    return parseFloat(order.total_paid_tax_incl || order.total_paid || '0') || 0;
  }

  fmt(n: number): string {
    return (
      n.toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) + ' €'
    );
  }

  formatDate(iso: string): string {
    if (!iso) return '';
    return new Date(iso).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  }

  parseFloat(value: string | number): number {
    return parseFloat(String(value)) || 0;
  }
}
