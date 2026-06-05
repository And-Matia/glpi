import {
  Component,
  OnInit,
  signal,
  computed,
  inject,
  ChangeDetectionStrategy,
} from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { LoaderComponent } from '@app/shared/components/loader/loader.component';
import { AlertComponent } from '@app/shared/components/alert/alert.component';
import { BadgeComponent, BadgeVariant } from '@app/shared/ui/badge/badge.component';
import { ButtonComponent } from '@app/shared/ui/button/button.component';
import { PageHeaderComponent } from '@app/shared/ui/page-header/page-header.component';
import { TableComponent, TableColumn } from '@app/shared/ui/table/table.component';
import { TableCellDirective } from '@app/shared/ui/table/table-cell.directive';
import { Order } from '@app/core/models';
import { OrderService, OrderTransitionService } from '@app/core/services';
import { CustomerService } from '@app/core/services';
import { ORDER_STATE_PAYMENT_ACCEPTED, ORDER_STATE_PAYMENT_CANCELLED, ORDER_STATE_DELIVERED, getOrderStateName, getOrderStateVariant } from '@app/core/constants';
import { formatCurrency, formatDateISO, useLoader } from '@app/core/utils';
import { CartsComponent } from '@app/features/admin/carts/carts.component';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-orders',
  standalone: true,
  imports: [
    LoaderComponent,
    AlertComponent,
    BadgeComponent,
    ButtonComponent,
    PageHeaderComponent,
    TableComponent,
    TableCellDirective,
    CartsComponent,
  ],
  templateUrl: './orders.component.html',
  styleUrl: './orders.component.css',
})
export class OrdersComponent implements OnInit {
  private readonly orderService = inject(OrderService);
  private readonly customerService = inject(CustomerService);
  private readonly orderTransition = inject(OrderTransitionService);
  private readonly loader = useLoader();

  readonly loading = this.loader.loading;
  readonly error = this.loader.error;
  readonly updating = signal<Set<number>>(new Set());

  private readonly _rows = signal<
    {
      id: number;
      reference: string;
      customerName: string;
      date: string;
      totalTtc: string;
      stateId: number | null;
      stateLabel: string;
      stateVariant: BadgeVariant;
    }[]
  >([]);

  readonly tableColumns: TableColumn[] = [
    { key: 'id', label: 'ID', sortable: true, width: '64px' },
    { key: 'reference', label: 'Référence', sortable: true },
    { key: 'customerName', label: 'Client', sortable: true, searchable: true },
    { key: 'date', label: 'Date', sortable: true },
    { key: 'totalTtc', label: 'Total TTC', sortable: true, align: 'right' },
    { key: 'stateLabel', label: 'État' },
    { key: '_actions', label: 'Actions', align: 'center', width: '190px' },
  ];

  readonly rows = computed(() => this._rows());

  readonly STATE_PAID = ORDER_STATE_PAYMENT_ACCEPTED;
  readonly STATE_CANCELLED = ORDER_STATE_PAYMENT_CANCELLED;
  readonly STATE_DELIVERED = ORDER_STATE_DELIVERED;

  ngOnInit(): void {
    void this.loader.run(async () => {
      const [orders, customers] = await Promise.all([
        firstValueFrom(this.orderService.getAllFull()),
        firstValueFrom(this.customerService.getAllFull()),
      ]);
      const customerNames = new Map<number, string>(
        customers.map((c) => [c.id, `${c.firstname} ${c.lastname}`.trim()]),
      );
      this._rows.set(orders.map((o) => this.toRow(o, customerNames)));
    });
  }

  async setStateDelivered(id: number): Promise<void> {
    await this.applyState(id, ORDER_STATE_DELIVERED);
  }

  async setStatePaid(id: number): Promise<void> {
    await this.applyState(id, ORDER_STATE_PAYMENT_ACCEPTED);
  }
  async setStateCancelled(id: number): Promise<void> {
    await this.applyState(id, ORDER_STATE_PAYMENT_CANCELLED);
  }

  private async applyState(id: number, stateId: number): Promise<void> {
    // Validations that are not supported by the module API
    if (![ORDER_STATE_DELIVERED, ORDER_STATE_PAYMENT_CANCELLED].includes(stateId)) {
      this.error.set(
        `État #${stateId} non supporté. Seuls les états "Livré" (5) et "Annulé" (6) sont autorisés.`,
      );
      return;
    }

    this.markUpdating(id, true);
    try {
      await firstValueFrom(this.orderTransition.create({ id_order: id, id_order_state: stateId }));
      this._rows.update((rows) =>
        rows.map((r) =>
          r.id === id
            ? {
                ...r,
                stateId,
                stateLabel: getOrderStateName(stateId),
                stateVariant: getOrderStateVariant(stateId),
              }
            : r,
        ),
      );
    } catch (err: Error | unknown) {
      this.error.set(`Commande #${id} : ${err instanceof Error ? err.message : 'Erreur'}`);
    } finally {
      this.markUpdating(id, false);
    }
  }

  private markUpdating(id: number, on: boolean): void {
    this.updating.update((set) => {
      const n = new Set(set);
      if (on) {
        n.add(id);
      } else {
        n.delete(id);
      }
      return n;
    });
  }

  isUpdating(id: number): boolean {
    return this.updating().has(id);
  }

  private toRow(
    o: Order,
    customerNames: Map<number, string>,
  ): {
    id: number;
    reference: string;
    customerName: string;
    date: string;
    totalTtc: string;
    stateId: number | null;
    stateLabel: string;
    stateVariant: BadgeVariant;
  } {
    const stateId = o.current_state ?? null;
    return {
      id: o.id,
      reference: o.reference || `#${o.id}`,
      customerName: customerNames.get(o.id_customer) || `Client #${o.id_customer}`,
      date: formatDateISO(o.date_add || ''),
      totalTtc: formatCurrency(parseFloat(o.total_paid_tax_incl || o.total_paid || '0'), 2),
      stateId,
      stateLabel: getOrderStateName(stateId),
      stateVariant: getOrderStateVariant(stateId),
    };
  }
}
