import {Component, ChangeDetectionStrategy, inject, signal, computed, OnInit} from '@angular/core';
import {AssetService} from '@app/core/services/glpi/api/asset.service';
import {TicketService} from '@app/core/services/glpi/api/ticket.service';
import {TicketCostService} from '@app/core/services/glpi/api/ticket-cost.service';
import {SuperCostService} from '@app/core/services/spring-boot/super-cost.service';
import {GlpiAsset} from '@app/core/models/asset.model';
import {Ticket, TicketCost} from '@app/core/models/assistance.model';
import {SuperCost} from '@app/core/models/super-cost.model';
import {ASSET_TYPES} from '@app/core/constants/asset.constants';
import {SpinnerComponent} from '@app/shared/ui/spinner/spinner.component';
import {TableComponent, TableColumn} from '@app/shared/ui/table/table.component';
import {TableCellDirective} from '@app/shared/ui/table/table-cell.directive';

@Component({
  selector: 'app-super-cost',
  imports: [SpinnerComponent, TableComponent, TableCellDirective],
  templateUrl: './super-cost.component.html',
  styleUrl: './super-cost.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SuperCostComponent implements OnInit {
  private readonly itemService       = inject(AssetService);
  private readonly ticketService     = inject(TicketService);
  private readonly ticketCostService = inject(TicketCostService);
  private readonly superCostService  = inject(SuperCostService);

  readonly loading     = signal(true);
  readonly error       = signal('');
  readonly tickets     = signal<Ticket[]>([]);
  readonly assets      = signal<GlpiAsset[]>([]);
  readonly ticketCosts = signal<TicketCost[]>([]);
  readonly superCosts  = signal<SuperCost[]>([]);

  readonly columns: TableColumn[] = [
    { key: 'label',     label: 'Type',               sortable: true                  },
    { key: 'count',     label: 'Nb assets',          sortable: true, align: 'center' },
    { key: 'fixedCost', label: 'Coût fixe',          sortable: true, align: 'right'  },
    { key: 'superCost', label: 'Super coût',         sortable: true, align: 'right'  },
    { key: 'total',     label: 'Total',              sortable: true, align: 'right'  },
  ];

  readonly rows = computed(() => {
    const assets      = this.assets();
    const tickets     = this.tickets();
    const ticketCosts = this.ticketCosts();
    const superCosts  = this.superCosts();

    const assetTypeMap = new Map(assets.map(a => [a.id, a.item_type]));

    const ticketTypeMap = new Map<number, string>();
    for (const ticket of tickets) {
      for (const itemId of ticket.items) {
        const type = assetTypeMap.get(Number(itemId));
        if (type) { ticketTypeMap.set(ticket.id, type); break; }
      }
    }

    const fixedByType = new Map<string, number>();
    for (const tc of ticketCosts) {
      const type = ticketTypeMap.get(tc.num_ticket);
      if (type) fixedByType.set(type, (fixedByType.get(type) ?? 0) + tc.fixed_cost);
    }

    const superByType = new Map<string, number>();
    for (const sc of superCosts) {
      const type = ticketTypeMap.get(sc.ticketId);
      if (type) superByType.set(type, (superByType.get(type) ?? 0) + sc.value);
    }

    return ASSET_TYPES
      .map(cfg => {
        const fixed = fixedByType.get(cfg.itemtype) ?? 0;
        const sup   = superByType.get(cfg.itemtype)  ?? 0;
        return {
          label:     cfg.label,
          count:     assets.filter(a => a.item_type === cfg.itemtype).length,
          fixedCost: this.fmt(fixed),
          superCost: this.fmt(sup),
          total:     this.fmt(fixed + sup),
        };
      })
      .filter(r => r.count > 0);
  });

  ngOnInit(): void {
    Promise.all([
      this.ticketService.getAll(),
      this.itemService.getAll(),
      this.ticketCostService.getAll(),
      this.superCostService.getAll(),
    ]).then(([tickets, assets, ticketCosts, superCosts]) => {
      this.tickets.set(tickets);
      this.assets.set(assets);
      this.ticketCosts.set(ticketCosts);
      this.superCosts.set(superCosts);
      this.loading.set(false);
    }).catch((err: Error) => {
      this.error.set(err.message ?? 'Erreur de chargement');
      this.loading.set(false);
    });
  }

  private fmt(value: number): string {
    return (isFinite(value) ? value : 0).toLocaleString('fr-FR', {style: 'currency', currency: 'EUR'});
  }
}
