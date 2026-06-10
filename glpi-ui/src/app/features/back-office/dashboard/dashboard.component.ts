import { Component, ChangeDetectionStrategy, inject, signal, computed, OnInit } from '@angular/core';
import { AssetService } from '@app/core/services/glpi/asset.service';
import { TicketService } from '@app/core/services/glpi/ticket.service';
import { GlpiAsset } from '@app/core/models/asset.model';
import { Ticket } from '@app/core/models/ticket.model';
import { ASSET_TYPES } from '@app/core/models/asset.model';
import { GLPI_TICKET_STATUS, GLPI_TICKET_TYPE } from '@app/core/models/ticket.model';
import { PageHeaderComponent } from '@app/shared/ui/page-header/page-header.component';
import { CardComponent } from '@app/shared/ui/card/card.component';
import { SpinnerComponent } from '@app/shared/ui/spinner/spinner.component';
import { BadgeComponent } from '@app/shared/ui/badge/badge.component';

@Component({
  selector: 'app-dashboard',
  imports: [PageHeaderComponent, CardComponent, SpinnerComponent, BadgeComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardComponent implements OnInit {
  private readonly itemService   = inject(AssetService);
  private readonly ticketService = inject(TicketService);

  readonly loading = signal(true);
  readonly error   = signal('');
  readonly tickets = signal<Ticket[]>([]);
  readonly assets  = signal<GlpiAsset[]>([]);

  readonly itemsByType = computed(() =>
    ASSET_TYPES
      .map(cfg => ({
        label: cfg.label,
        count: this.assets().filter(a => a.item_type === cfg.itemtype).length,
      }))
      .filter(entry => entry.count > 0)
  );

  readonly ticketsByType = computed(() =>
    Object.entries(GLPI_TICKET_TYPE).map(([code, label]) => ({
      label,
      count: this.tickets().filter(t => t.type === Number(code)).length,
    }))
  );

  readonly ticketsByStatus = computed(() =>
    Object.entries(GLPI_TICKET_STATUS).map(([code, label]) => ({
      label,
      count: this.tickets().filter(t => t.status === Number(code)).length,
    }))
  );

  ngOnInit(): void {
    Promise.all([
      this.ticketService.getAll(),
      this.itemService.getAll(),
    ])
      .then(([tickets, assets]) => {
        this.tickets.set(tickets);
        this.assets.set(assets);
        this.loading.set(false);
      })
      .catch((err: Error) => {
        this.error.set(err.message ?? 'Erreur de chargement');
        this.loading.set(false);
      });
  }
}
