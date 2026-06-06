import { Component, ChangeDetectionStrategy, inject, signal, computed, OnInit } from '@angular/core';
import { forkJoin } from 'rxjs';
import { ItemV1Service } from '@app/core/services/glpi/item/item-v1.service';
import { TicketV1Service } from '@app/core/services/glpi/ticket/ticket-v1.service';
import { Ticket } from '@app/core/models/ticket.model';
import { Item } from '@app/core/models/item.model';
import { ASSET_TYPES, GLPI_TICKET_STATUS, GLPI_TICKET_TYPE } from '@app/core/constants/glpi.constants';
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
  private readonly itemService   = inject(ItemV1Service);
  private readonly ticketService = inject(TicketV1Service);

  readonly loading = signal(true);
  readonly error   = signal('');
  readonly tickets = signal<Ticket[]>([]);
  readonly items   = signal<Item[]>([]);

  // One {label, count} entry per supported asset type (only types that have items).
  readonly itemsByType = computed(() =>
    ASSET_TYPES
      .map(cfg => ({
        label: cfg.label,
        count: this.items().filter(i => i.item_type === cfg.itemtype).length,
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
    forkJoin({
      tickets: this.ticketService.getAll(),
      items:   this.itemService.getAll(),
    }).subscribe({
      next: ({ tickets, items }) => {
        this.tickets.set(tickets);
        this.items.set(items);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err.message ?? 'Erreur de chargement');
        this.loading.set(false);
      },
    });
  }
}
