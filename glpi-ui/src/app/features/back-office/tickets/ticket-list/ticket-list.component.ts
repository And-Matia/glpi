import { Component, ChangeDetectionStrategy, inject, signal, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { TicketService } from '@app/core/services/glpi/ticket.service';
import { GLPI_TICKET_STATUS, GLPI_TICKET_TYPE, GLPI_TICKET_PRIORITY } from '@app/core/models/ticket.model';
import { MatButtonModule } from '@angular/material/button';
import { TableComponent, TableColumn } from '@app/shared/ui/table/table.component';
import { TableCellDirective } from '@app/shared/ui/table/table-cell.directive';
import { PageHeaderComponent } from '@app/shared/ui/page-header/page-header.component';
import { SpinnerComponent } from '@app/shared/ui/spinner/spinner.component';

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

  readonly loading = signal(true);
  readonly error   = signal('');
  readonly rows    = signal<Record<string, any>[]>([]);

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
    this.ticketService.getAll()
      .then(tickets => {
        this.rows.set(tickets.map(t => ({
          id:         t.id,
          ref_ticket: t.ref_ticket,
          date:       t.date,
          titre:      t.titre,
          type:       GLPI_TICKET_TYPE[t.type]        ?? t.type,
          status:     GLPI_TICKET_STATUS[t.status]    ?? t.status,
          priority:   GLPI_TICKET_PRIORITY[t.priority] ?? t.priority,
        })));
        this.loading.set(false);
      })
      .catch((err: Error) => {
        this.error.set(err.message ?? 'Erreur de chargement');
        this.loading.set(false);
      });
  }

  openTicket(row: Record<string, any>): void {
    this.router.navigate(['/back-office/tickets', row['id']]);
  }
}
