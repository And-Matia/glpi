import { Component, ChangeDetectionStrategy, input, computed } from '@angular/core';
import { Ticket } from '@app/core/models/assistance.model';
import {
  TICKET_TYPES,
  ticketStatusLabel, ticketStatusVariant,
  ticketPriorityLabel, ticketPriorityVariant,
  ticketTypeLabel,
} from '@app/core/constants/assistance.constants';
import { TableComponent, TableColumn } from '@app/shared/ui/table/table.component';
import { TableCellDirective } from '@app/shared/ui/table/table-cell.directive';
import { BadgeComponent } from '@app/shared/ui/badge/badge.component';

@Component({
  selector: 'app-ticket-list',
  standalone: true,
  imports: [TableComponent, TableCellDirective, BadgeComponent],
  templateUrl: './ticket-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TicketListComponent {
  readonly tickets = input.required<Ticket[]>();

  readonly columns: TableColumn[] = [
    { key: 'ref_ticket', label: 'Réf.',     sortable: true, width: '80px'  },
    { key: 'date',       label: 'Date',     sortable: true, width: '110px' },
    { key: 'titre',      label: 'Titre',    sortable: true                 },
    { key: 'type_label', label: 'Type',     sortable: true, width: '100px' },
    { key: 'status',     label: 'Statut',   sortable: true, width: '170px' },
    { key: 'priority',   label: 'Priorité', sortable: true, width: '110px' },
  ];

  readonly rows = computed(() =>
    this.tickets().map(t => ({ ...t, type_label: ticketTypeLabel(t.type) }))
  );

  readonly statusLabel    = ticketStatusLabel;
  readonly statusVariant  = ticketStatusVariant;
  readonly priorityLabel  = ticketPriorityLabel;
  readonly priorityVariant = ticketPriorityVariant;
}
