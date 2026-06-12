import { Component, ChangeDetectionStrategy, inject, signal, computed, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TicketService } from '@app/core/services/glpi/api/ticket.service';
import { TicketCostService } from '@app/core/services/glpi/api/ticket-cost.service';
import { AssetService } from '@app/core/services/glpi/api/asset.service';
import { Ticket, TicketCost } from '@app/core/models/assistance.model';
import { GlpiAsset } from '@app/core/models/asset.model';
import {
  ticketStatusLabel, ticketStatusVariant,
  ticketTypeLabel,
  ticketPriorityLabel, ticketPriorityVariant,
} from '@app/core/constants/assistance.constants';
import { assetLabel } from '@app/core/constants/asset.constants';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { PageHeaderComponent } from '@app/shared/ui/page-header/page-header.component';
import { BadgeComponent } from '@app/shared/ui/badge/badge.component';
import { SpinnerComponent } from '@app/shared/ui/spinner/spinner.component';
import { StatCardComponent } from '@app/shared/ui/stat-card/stat-card.component';

@Component({
  selector: 'app-ticket-detail',
  imports: [MatCardModule, MatButtonModule, MatDividerModule, PageHeaderComponent, BadgeComponent, SpinnerComponent, StatCardComponent],
  templateUrl: './ticket-detail.component.html',
  styleUrl: './ticket-detail.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TicketDetailComponent implements OnInit {
  private readonly route     = inject(ActivatedRoute);
  private readonly router    = inject(Router);
  private readonly ticketSvc = inject(TicketService);
  private readonly costSvc   = inject(TicketCostService);
  private readonly assetSvc  = inject(AssetService);

  readonly loading      = signal(true);
  readonly error        = signal('');
  readonly ticket       = signal<Ticket | null>(null);
  readonly costs        = signal<TicketCost[]>([]);
  readonly linkedAssets = signal<GlpiAsset[]>([]);

  readonly statusLabel     = ticketStatusLabel;
  readonly statusVariant   = ticketStatusVariant;
  readonly typeLabel       = ticketTypeLabel;
  readonly priorityLabel   = ticketPriorityLabel;
  readonly priorityVariant = ticketPriorityVariant;
  readonly assetTypeLabel  = assetLabel;

  readonly totalDuration = computed(() => {
    const secs = this.costs().reduce((s, c) => s + c.duration_second, 0);
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    return h > 0 ? `${h}h ${m}min` : `${m}min`;
  });

  readonly totalTimeCost      = computed(() => this.costs().reduce((s, c) => s + c.time_cost,      0));
  readonly totalFixedCost     = computed(() => this.costs().reduce((s, c) => s + c.fixed_cost,     0));
  readonly totalMaterialCost  = computed(() => this.costs().reduce((s, c) => s + c.cost_material,  0));
  readonly totalCost          = computed(() => this.totalTimeCost() + this.totalFixedCost() + this.totalMaterialCost());

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    Promise.all([
      this.ticketSvc.getById(id),
      this.costSvc.getByTicketId(id),
      this.ticketSvc.getLinkedItems(id).then(items =>
        Promise.all(
          items.map(item => this.assetSvc.getById(item.items_id, item.itemtype).catch(() => null))
        ).then(results => results.filter((a): a is GlpiAsset => a !== null))
      ),
    ])
      .then(([ticket, costs, linkedAssets]) => {
        this.ticket.set(ticket);
        this.costs.set(costs);
        this.linkedAssets.set(linkedAssets);
        this.loading.set(false);
      })
      .catch((err: Error) => {
        this.error.set(err.message ?? 'Erreur de chargement');
        this.loading.set(false);
      });
  }

  formatCost(value: number): string {
    return value.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' });
  }

  formatDuration(secs: number): string {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    return h > 0 ? `${h}h ${m}min` : `${m}min`;
  }

  goBack(): void {
    this.router.navigate(['/back-office/tickets']);
  }
}
