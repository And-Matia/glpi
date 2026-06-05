import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { Cart, CartService, CustomerService } from '@app/core';
import { TableColumn, TableComponent } from '@app/shared/ui/table/table.component';
import { firstValueFrom } from 'rxjs';
import { PageHeaderComponent } from '@app/shared/ui/page-header/page-header.component';
import { AlertComponent } from '@app/shared/components/alert/alert.component';
import { LoaderComponent } from '@app/shared/components/loader/loader.component';
import { formatDateISO, useLoader } from '@app/core/utils';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-carts',
  standalone: true,
  imports: [PageHeaderComponent, AlertComponent, LoaderComponent, TableComponent],
  templateUrl: './carts.component.html',
  styleUrl: './carts.component.css',
})
export class CartsComponent implements OnInit {
  private readonly cartService = inject(CartService);
  private readonly customerService = inject(CustomerService);
  private readonly loader = useLoader();

  readonly loading = this.loader.loading;
  readonly error = this.loader.error;

  private readonly _rows = signal<
    Array<{
      id: number;
      customerName: string;
      date: string;
    }>
  >([]);

  readonly tableColumns: TableColumn[] = [
    { key: 'id', label: 'ID', sortable: true, width: '64px' },
    { key: 'customerName', label: 'Client', sortable: true, searchable: true },
    { key: 'date', label: 'Date', sortable: true },
  ];

  readonly rows = computed(() => this._rows());

  ngOnInit() {
    void this.loader.run(async () => {
      const [carts, customers] = await Promise.all([
        firstValueFrom(this.cartService.getAllFull()),
        firstValueFrom(this.customerService.getAllFull()),
      ]);

      const customerNames = new Map<number, string>(
        customers.map((c) => [c.id, `${c.firstname}`.trim()]),
      );
      this._rows.set(carts.map((c) => this.toRow(c, customerNames)));
    });
  }

  private toRow(
    c: Cart,
    customerNames: Map<number, string>,
  ): {
    id: number;
    customerName: string;
    date: string;
  } {
    return {
      id: c.id,
      customerName: customerNames.get(<number>c.id_customer) || `Client #${c.id_customer}`,
      date: formatDateISO(c.date_add || ''),
    };
  }
}
