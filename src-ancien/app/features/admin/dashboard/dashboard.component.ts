import {
  Component,
  signal,
  OnInit,
  computed,
  inject,
  ChangeDetectionStrategy,
} from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { CardComponent } from '@app/shared/components/card/card.component';
import { LoaderComponent } from '@app/shared/components/loader/loader.component';
import { AlertComponent } from '@app/shared/components/alert/alert.component';
import { BadgeComponent } from '@app/shared/ui/badge/badge.component';
import { EmptyStateComponent } from '@app/shared/ui/empty-state/empty-state.component';
import { PageHeaderComponent } from '@app/shared/ui/page-header/page-header.component';
import { TableComponent, TableColumn } from '@app/shared/ui/table/table.component';
import { TableCellDirective } from '@app/shared/ui/table/table-cell.directive';
import { OrderService } from '@app/core/services';
import { formatCurrency, formatDateISO, useLoader } from '@app/core/utils';
import {
  ORDER_STATE_CART,
  ORDER_STATE_PAYMENT_ACCEPTED,
  ORDER_STATE_PAYMENT_CANCELLED,
} from '@app/core/constants';
import { CategoryStockStatsComponent } from '../stats/components/category-stock-stats/category-stock-stats.component';

interface DayStats {
  date:     string;
  orders:   number;
  amount:   number;
  amountHt: number;
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CardComponent, LoaderComponent, AlertComponent,
    BadgeComponent, EmptyStateComponent, PageHeaderComponent,
    TableComponent, TableCellDirective, CategoryStockStatsComponent,
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
})
export class DashboardComponent implements OnInit {
  private readonly orderService = inject(OrderService);
  private readonly loader = useLoader();

  readonly loading       = this.loader.loading;
  readonly error         = this.loader.error;
  readonly dailyStats    = signal<DayStats[]>([]);
  readonly countPaid     = signal(0);
  readonly countCancelled = signal(0);

  readonly todayStats = computed(() => {
    const today = new Date().toISOString().slice(0, 10);
    return this.dailyStats().find(d => d.date === today) ?? { orders: 0, amount: 0, amountHt: 0 };
  });

  readonly totalOrders   = computed(() => this.dailyStats().reduce((s, d) => s + d.orders, 0));
  readonly totalAmount   = computed(() => this.dailyStats().reduce((s, d) => s + d.amount, 0));
  readonly totalAmountHt = computed(() => this.dailyStats().reduce((s, d) => s + d.amountHt, 0));

  readonly todayAmountHtFormatted = computed(() => formatCurrency(this.todayStats().amountHt, 2));
  readonly todayAmountFormatted = computed(() => formatCurrency(this.todayStats().amount, 2));
  readonly totalAmountHtFormatted = computed(() => formatCurrency(this.totalAmountHt(), 2));
  readonly totalAmountFormatted = computed(() => formatCurrency(this.totalAmount(), 2));

  readonly tableColumns: TableColumn[] = [
    { key: 'date',     label: 'Date',         sortable: true },
    { key: 'orders',   label: 'Nb commandes', sortable: true },
    { key: 'amountHt', label: 'Montant HT',   sortable: true },
    { key: 'amount',   label: 'Montant TTC',  sortable: true },
  ];

  readonly tableRows = computed(() =>
    this.dailyStats().map(d => ({
      date:     formatDateISO(d.date),
      orders:   d.orders,
      amountHt: formatCurrency(d.amountHt, 2),
      amount:   formatCurrency(d.amount, 2),
    })),
  );

  ngOnInit(): void {
    void this.loader.run(async () => {
      const orders = await firstValueFrom(this.orderService.getAllFull());
      this.countPaid.set(orders.filter(o => o.current_state === ORDER_STATE_PAYMENT_ACCEPTED).length);
      this.countCancelled.set(orders.filter(o => o.current_state === ORDER_STATE_PAYMENT_CANCELLED).length);

      const byDay = new Map<string, DayStats>();
      for (const order of orders) {
        if (order.current_state === ORDER_STATE_PAYMENT_CANCELLED) continue;
        const date   = order.date_add?.slice(0, 10) ?? '';
        if (!date) continue;
        const amount   = parseFloat(order.total_paid_tax_incl || order.total_paid || '0');
        const amountHt = parseFloat(order.total_paid_tax_excl || '0');
        const prev     = byDay.get(date) ?? { date, orders: 0, amount: 0, amountHt: 0 };
        byDay.set(date, {
          date,
          orders:   prev.orders + 1,
          amount:   prev.amount + amount,
          amountHt: prev.amountHt + amountHt,
        });
      }

      this.dailyStats.set([...byDay.values()].sort((a, b) => b.date.localeCompare(a.date)));
    });
  }

}
