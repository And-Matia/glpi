import { Component, ChangeDetectionStrategy, inject, signal, computed, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { TicketService } from '@app/core/services/glpi/api/ticket.service';
import { Ticket } from '@app/core/models';
import { ticketStatusLabel, ticketTypeLabel, ticketPriorityLabel } from '@app/core/constants/assistance.constants';
import { MatButtonModule } from '@angular/material/button';
import { TableComponent, TableColumn } from '@app/shared/ui/table/table.component';
import { TableCellDirective } from '@app/shared/ui/table/table-cell.directive';
import { PageHeaderComponent } from '@app/shared/ui/page-header/page-header.component';
import { SpinnerComponent } from '@app/shared/ui/spinner/spinner.component';
import { TicketStatusService } from '@app/core/services/spring-boot/ticket-status.service';

@Component({
  selector: 'app-ticket-list',
  imports: [MatButtonModule, TableComponent, TableCellDirective, PageHeaderComponent, SpinnerComponent],
  templateUrl: './ticket-list.component.html',
  styleUrl: './ticket-list.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TicketListComponent implements OnInit {
  private readonly ticketService = inject(TicketService);
  private readonly router        = inject(Router);
  private readonly status        = inject(TicketStatusService);

  readonly loading = signal(true);
  readonly error   = signal('');

  private readonly tickets = signal<Ticket[]>([]);

  readonly rows = computed(() =>
    this.tickets().map(t => ({
      id:          t.id,
      ref_ticket:  t.ref_ticket,
      date:        t.date,
      titre:       t.titre,
      type:        ticketTypeLabel(t.type),
      status:      ticketStatusLabel(t.status),
      status_code: t.status,
      priority:    ticketPriorityLabel(t.priority),
      color:       this.status.columns().find(c => c.statusCode === t.status)?.color ?? '',
    })),
  );

  readonly columns: TableColumn[] = [
    { key: 'ref_ticket', label: 'Réf.',     sortable: true, width: '80px'  },
    { key: 'date',       label: 'Date',      sortable: true, width: '110px' },
    { key: 'titre',      label: 'Titre',     sortable: true                 },
    { key: 'type',       label: 'Type',      sortable: true, width: '110px' },
    { key: 'status',     label: 'Statut',    sortable: true, width: '160px' },
    { key: 'priority',   label: 'Priorité',  sortable: true, width: '110px' },
    { key: 'actions',    label: '',                          width: '80px'  },
  ];

  ngOnInit(): void {
    Promise.all([
      this.ticketService.getAll(),
      this.status.load(),
    ]).then(([tickets]) => {
      this.tickets.set(tickets);
      this.loading.set(false);
    }).catch((err: Error) => {
      this.error.set(err.message ?? 'Erreur de chargement');
      this.loading.set(false);
    });
  }

  openTicket(row: Record<string, any>): void {
    this.router.navigate(['/back-office/tickets', row['id']]);
  }
}
