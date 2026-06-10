import { Component, OnInit, inject, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { TicketStatusService } from '@app/core/services/core-api/ticket-status.service';
import { ToastService } from '@app/core/services/toast.service';
import { TicketStatus, TicketStatusName } from '@app/core/models';

@Component({
  selector: 'app-settings-kanban',
  imports: [],
  templateUrl: './kanban-configuration.component.html',
  styleUrl: './kanban-configuration.component.css',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KanbanConfigurationComponent implements OnInit {
  private readonly ticketStatusService = inject(TicketStatusService);
  private readonly toast               = inject(ToastService);

  readonly statuses  = signal<TicketStatus[]>([]);
  readonly selectedId = signal<number>(0);
  readonly saving    = signal(false);

  readonly selectedStatus = computed(() => {
    for (const s of this.statuses()) {
      if (s.id === this.selectedId()) return s;
    }
    return null;
  });

  async ngOnInit(): Promise<void> {
    const statuses = await this.ticketStatusService.getStatuses();
    this.statuses.set(statuses);
    if (statuses.length > 0) {
      this.selectedId.set(statuses[0].id as number);
    }
  }

  onSelectChange(value: string): void {
    this.selectedId.set(Number(value));
  }

  displayName(status: TicketStatus): string {
    if (status.names.length > 0) return status.names[0].name;
    return `Statut ${status.id}`;
  }

  updateColor(color: string): void {
    const updated: TicketStatus[] = [];
    for (const s of this.statuses()) {
      if (s.id === this.selectedId()) {
        updated.push({ ...s, color });
      } else {
        updated.push(s);
      }
    }
    this.statuses.set(updated);
  }

  updateName(index: number, name: string): void {
    const current = this.selectedStatus();
    if (!current) return;

    const updatedNames: TicketStatusName[] = [];
    for (let i = 0; i < current.names.length; i++) {
      if (i === index) {
        updatedNames.push({ ...current.names[i], name });
      } else {
        updatedNames.push(current.names[i]);
      }
    }

    const updated: TicketStatus[] = [];
    for (const s of this.statuses()) {
      if (s.id === this.selectedId()) {
        updated.push({ ...s, names: updatedNames });
      } else {
        updated.push(s);
      }
    }
    this.statuses.set(updated);
  }

  async save(): Promise<void> {
    const current = this.selectedStatus();
    if (!current) return;
    this.saving.set(true);
    try {
      await this.ticketStatusService.updateStatus(current);
      this.toast.success('Statut sauvegardé.');
    } catch {
      this.toast.error('Erreur lors de la sauvegarde.');
    } finally {
      this.saving.set(false);
    }
  }
}
