import { Component, OnInit, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DragDropModule, CdkDragDrop } from '@angular/cdk/drag-drop';
import { MatButtonModule } from '@angular/material/button';
import { TicketService } from '@app/core/services/glpi/ticket.service';
import { KanbanSettingsService } from '@app/core/services/kanban-settings.service';
import { Ticket, GLPI_TICKET_TYPE, GLPI_TICKET_PRIORITY } from '@app/core/models/ticket.model';
import { BadgeComponent } from '@app/shared/ui/badge/badge.component';
import { SpinnerComponent } from '@app/shared/ui/spinner/spinner.component';
import { ModalComponent } from '@app/shared/ui/modal/modal.component';
import { ConfirmDialogComponent } from '@app/shared/ui/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-kanban',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DragDropModule,
    RouterLink,
    MatButtonModule,
    SpinnerComponent,
    BadgeComponent,
    ModalComponent,
    ConfirmDialogComponent,
  ],
  templateUrl: './kanban.component.html',
  styleUrl: './kanban.component.css',
})
export class KanbanComponent implements OnInit {
  private readonly ticketService = inject(TicketService);
  readonly settings              = inject(KanbanSettingsService);

  readonly loading        = signal(true);
  readonly error          = signal('');
  readonly tickets        = signal<Ticket[]>([]);
  readonly detailOpen     = signal(false);
  readonly selectedTicket = signal<Ticket | null>(null);
  readonly confirmOpen    = signal(false);

  private pendingMove: { ticket: Ticket; toStatus: number } | null = null;

  readonly typeLabel     = (code: number) => GLPI_TICKET_TYPE[code]     ?? String(code);
  readonly priorityLabel = (code: number) => GLPI_TICKET_PRIORITY[code] ?? String(code);

  ticketsForColumn(statusCode: number): Ticket[] {
    return this.tickets().filter(t => t.status === statusCode);
  }

  async ngOnInit(): Promise<void> {
    try {
      this.tickets.set(await this.ticketService.getAll());
    } catch (err: any) {
      this.error.set(err.message ?? 'Erreur de chargement');
    } finally {
      this.loading.set(false);
    }
  }

  onDrop(event: CdkDragDrop<Ticket[]>, toStatusCode: number): void {
    if (event.previousContainer === event.container) return;
    const ticket = event.item.data as Ticket;

    // Moving to "Résolu" requires confirmation
    if (toStatusCode === 5 && ticket.status !== 5) {
      this.pendingMove = { ticket, toStatus: toStatusCode };
      this.confirmOpen.set(true);
    } else {
      this.applyMove(ticket, toStatusCode);
    }
  }

  onConfirmed(): void {
    this.confirmOpen.set(false);
    if (this.pendingMove) {
      this.applyMove(this.pendingMove.ticket, this.pendingMove.toStatus);
      this.pendingMove = null;
    }
  }

  onCancelled(): void {
    this.confirmOpen.set(false);
    this.pendingMove = null;
  }

  openDetail(ticket: Ticket, event: MouseEvent): void {
    event.stopPropagation();
    this.selectedTicket.set(ticket);
    this.detailOpen.set(true);
  }

  private applyMove(ticket: Ticket, toStatus: number): void {
    this.ticketService.update(ticket.id, { status: toStatus }).catch(() => {});
    this.tickets.update(list =>
      list.map(t => t.id === ticket.id ? { ...t, status: toStatus } : t)
    );
  }
}
