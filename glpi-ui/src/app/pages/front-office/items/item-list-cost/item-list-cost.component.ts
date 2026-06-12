import {Component, ChangeDetectionStrategy, inject, signal, computed, OnInit} from '@angular/core';
import {AssetService} from '@app/core/services/glpi/api/asset.service';
import {TicketService} from '@app/core/services/glpi/api/ticket.service';
import {TicketCostService} from '@app/core/services/glpi/api/ticket-cost.service';
import {GlpiAsset} from '@app/core/models/asset.model';
import {Ticket, TicketCost} from '@app/core/models/assistance.model';
import {TICKET_STATUSES, TICKET_TYPES} from '@app/core/constants/assistance.constants';
import {ASSET_TYPES} from '@app/core/constants/asset.constants';
import {MatCardModule} from '@angular/material/card';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {PageHeaderComponent} from '@app/shared/ui/page-header/page-header.component';
import {SpinnerComponent} from '@app/shared/ui/spinner/spinner.component';
import {BadgeComponent} from '@app/shared/ui/badge/badge.component';
import {StatCardComponent} from '@app/shared/ui/stat-card/stat-card.component';
import {AssetListComponent} from '@app/shared/components/asset-list/asset-list.component';
import {TicketListComponent} from '@app/shared/components/ticket-list/ticket-list.component';
import {SuperCostService} from '@app/core/services/spring-boot/super-cost.service';

@Component({
  selector: 'app-dashboard',
  imports: [MatCardModule, MatButtonModule, MatIconModule, PageHeaderComponent, SpinnerComponent, BadgeComponent, StatCardComponent, AssetListComponent, TicketListComponent],
  templateUrl: './item-list-cost.component.html',
  styleUrl: './item-list-cost.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ItemListCostComponent implements OnInit {
  private readonly itemService = inject(AssetService);
  private readonly ticketService = inject(TicketService);
  private readonly superCostService = inject(SuperCostService);
  private readonly ticketCostService = inject(TicketCostService);

  readonly loading = signal(true);
  readonly error = signal('');
  readonly tickets = signal<Ticket[]>([]);
  readonly assets = signal<GlpiAsset[]>([]);
  readonly ticketCosts = signal<TicketCost[]>([]);

  readonly showAssetTable = signal(false);
  readonly showTicketTable = signal(false);

  // ── Totaux ──────────────────────────────────────────────────────────────────
  readonly totalAssets = computed(() => this.assets().length);
  readonly totalTickets = computed(() => this.tickets().length);

  readonly totalFixedCost = computed(() =>
    this.ticketCosts().reduce((sum, c) => sum + (c.fixed_cost), 0)
  );
  readonly totalTimeCost = computed(() =>
    this.ticketCosts().reduce((sum, c) => sum + (c.time_cost * c.duration_second / 3600), 0)
  );
  readonly totalCost = computed(() => this.totalFixedCost() + this.totalTimeCost());

  readonly totalDuration = computed(() => {
    const secs = this.ticketCosts().reduce((sum, c) => sum + c.duration_second, 0);
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    return `${h}h ${m}min`;
  });

  // ── Détails ─────────────────────────────────────────────────────────────────
  readonly itemsByType = computed(() =>
    ASSET_TYPES
      .map(cfg => ({label: cfg.label, count: this.assets().filter(a => a.item_type === cfg.itemtype).length}))
      .filter(entry => entry.count > 0)
  );

  readonly ticketsByType = computed(() =>
    TICKET_TYPES.map(cfg => ({
      label: cfg.label,
      count: this.tickets().filter(t => t.type === cfg.code).length,
    }))
  );

  readonly ticketsByStatus = computed(() =>
    TICKET_STATUSES
      .map(cfg => ({label: cfg.label, count: this.tickets().filter(t => t.status === cfg.code).length}))
      .filter(e => e.count > 0)
  );

  ngOnInit(): void {
    Promise.all([
      this.ticketService.getAll(),
      this.itemService.getAll(),
      this.ticketCostService.getAll(),
      this.superCostService.getAll()
    ])
      .then(([tickets, assets, ticketCosts]) => {
        this.tickets.set(tickets);
        this.assets.set(assets);
        this.ticketCosts.set(ticketCosts);
        this.loading.set(false);
      })
      .catch((err: Error) => {
        this.error.set(err.message ?? 'Erreur de chargement');
        this.loading.set(false);
      });
  }

  formatCost(value: number): string {
    const n = isFinite(value) ? value : 0;
    return n.toLocaleString('fr-FR', {style: 'currency', currency: 'EUR'});
  }

  getCostTotal() {}
}
