import {Component, OnInit, inject, signal, computed, ChangeDetectionStrategy} from '@angular/core';
import {RouterLink} from '@angular/router';
import {DragDropModule, CdkDragDrop} from '@angular/cdk/drag-drop';
import {MatButtonModule} from '@angular/material/button';
import {TicketService} from '@app/core/services/glpi/api/ticket.service';
import {TicketStatusService} from '@app/core/services/spring-boot/ticket-status.service';
import {ToastService} from '@app/core/services/ui/toast.service';
import {UserService} from '@app/core/services/glpi/api/user.service';
import {Ticket} from '@app/core/models/assistance.model';
import {ticketTypeLabel, ticketPriorityLabel} from '@app/core/constants/assistance.constants';
import {BadgeComponent} from '@app/shared/ui/badge/badge.component';
import {SpinnerComponent} from '@app/shared/ui/spinner/spinner.component';
import {ModalComponent} from '@app/shared/ui/modal/modal.component';
import {SelectComponent, SelectOption} from '@app/shared/ui/select/select.component';
import {TextareaComponent} from '@app/shared/ui/textarea/textarea.component';
import {SuperCostService} from '@app/core/services/spring-boot/super-cost.service';

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
    SelectComponent,
    TextareaComponent,
  ],
  templateUrl: './kanban.component.html',
  styleUrl: './kanban.component.css',
})
export class KanbanComponent implements OnInit {
  private readonly ticketService = inject(TicketService);
  private readonly userService = inject(UserService);
  private readonly toast = inject(ToastService);
  readonly status = inject(TicketStatusService);
  readonly superCostService = inject(SuperCostService);

  readonly loading = signal(true);
  readonly error = signal('');
  readonly tickets = signal<Ticket[]>([]);
  readonly detailOpen = signal(false);
  readonly selectedTicket = signal<Ticket | null>(null);

  // Assign modal (New → In Progress)
  readonly assignOpen = signal(false);
  readonly assigneeType = signal<string>('user');
  readonly assigneeId = signal('');
  readonly assigneeIdError = signal('');
  readonly assignSaving = signal(false);
  readonly userOptions = signal<SelectOption[]>([]);
  readonly usersLoading = signal(false);

  // Solution modal (In Progress → Closed)
  readonly solutionOpen = signal(false);
  solutionText = signal('');
  superCost = signal('');
  readonly solutionError = signal('');
  readonly solutionSaving = signal(false);

  private pendingTicket: Ticket | null = null;

  readonly typeLabel = ticketTypeLabel;
  readonly priorityLabel = ticketPriorityLabel;

  readonly assignTypeOptions: SelectOption[] = [
    {value: 'user', label: 'Technicien'},
    {value: 'group', label: 'Groupe'},
    {value: 'supplier', label: 'Fournisseur'},
  ];

  readonly langOptions = computed<SelectOption[]>(() =>
    this.status.availableLanguages().map(l => ({value: String(l.id), label: l.name})),
  );

  readonly selectedLangValue = computed(() => String(this.status.selectedLangId()));


  ticketsForColumn(statusCode: number): Ticket[] {
    return this.tickets().filter(t => t.status === statusCode);
  }

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

  onDrop(event: CdkDragDrop<Ticket[]>, toStatusCode: number): void {
    if (event.previousContainer === event.container) return;
    const ticket = event.item.data as Ticket;

    if (ticket.status === 1 && toStatusCode === 2) {
      this.pendingTicket = ticket;
      this.assigneeType.set('user');
      this.assigneeId.set('');
      this.assigneeIdError.set('');
      this.assignOpen.set(true);
      this.loadUsers();
    } else if (toStatusCode === 6 && ticket.status !== 6) {
      this.pendingTicket = ticket;
      this.solutionText.set('');
      this.superCost.set('');
      this.solutionError.set('');
      this.solutionOpen.set(true);
    } else {
      this.applyMove(ticket, toStatusCode);
    }
  }

  private async loadUsers(): Promise<void> {
    if (this.userOptions().length) return;
    this.usersLoading.set(true);
    try {
      const users = await this.userService.getAll();
      this.userOptions.set(users.map(u => ({
        value: String(u.id),
        label: [u.firstname, u.realname].filter(Boolean).join(' ') || u.name,
      })));
    } catch {
      this.toast.error('Impossible de charger la liste des utilisateurs');
    } finally {
      this.usersLoading.set(false);
    }
  }

  async onAssignConfirmed(): Promise<void> {
    const id = Number(this.assigneeId());
    if (!id || id <= 0) {
      this.assigneeIdError.set('Veuillez sélectionner un utilisateur');
      return;
    }
    if (!this.pendingTicket) return;

    this.assignSaving.set(true);
    try {
      await this.ticketService.assign(
        this.pendingTicket.id,
        this.assigneeType() as 'user' | 'group' | 'supplier',
        id,
      );
      this.tickets.update(list =>
        list.map(t => t.id === this.pendingTicket!.id ? {...t, status: 2} : t),
      );
      this.assignOpen.set(false);
      this.pendingTicket = null;
    } catch {
      this.toast.error('Erreur lors de l\'assignation du ticket');
    } finally {
      this.assignSaving.set(false);
    }
  }

  onAssignSkipped(): void {
    if (!this.pendingTicket) return;
    this.applyMove(this.pendingTicket, 2);
    this.assignOpen.set(false);
    this.pendingTicket = null;
  }

  onAssignCancelled(): void {
    this.assignOpen.set(false);
    this.pendingTicket = null;
  }

  async onSolutionConfirmed(): Promise<void> {
    if (!this.solutionText().trim()) {
      this.solutionError.set('La solution ne peut pas être vide');
      return;
    }
    if (!this.pendingTicket) return;

    this.solutionSaving.set(true);
    try {
      await this.ticketService.postSolution(this.pendingTicket.id, this.solutionText().trim());
      await this.ticketService.update(this.pendingTicket.id, {status: 6} as any);
      this.tickets.update(list =>
        list.map(t => t.id === this.pendingTicket!.id ? {...t, status: 6} : t),
      );
      await this.superCostService.create(this.pendingTicket.id, this.superCost().trim());
      this.solutionOpen.set(false);
      this.pendingTicket = null;
    } catch (e) {
      this.toast.error('Erreur' + e);
    } finally {
      this.solutionSaving.set(false);
    }
  }

  onSolutionSkipped(): void {
    if (!this.pendingTicket) return;
    this.applyMove(this.pendingTicket, 6);
    this.solutionOpen.set(false);
    this.pendingTicket = null;
  }

  onSolutionCancelled(): void {
    this.solutionOpen.set(false);
    this.pendingTicket = null;
  }

  openDetail(ticket: Ticket, event: MouseEvent): void {
    event.stopPropagation();
    this.selectedTicket.set(ticket);
    this.detailOpen.set(true);
  }

  private applyMove(ticket: Ticket, toStatus: number): void {
    this.ticketService.update(ticket.id, {status: toStatus} as any).catch(() => {
    });
    this.tickets.update(list =>
      list.map(t => t.id === ticket.id ? {...t, status: toStatus} : t),
    );
  }
}
