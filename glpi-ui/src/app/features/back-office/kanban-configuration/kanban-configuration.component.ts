import { Component, OnInit, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { TicketStatusService } from '@app/core/services/core-api/ticket-status.service';
import { KanbanSettingsService, KanbanColumn } from '@app/core/services/kanban-settings.service';
import { ToastService } from '@app/core/services/toast.service';
import { TicketStatus } from '@app/core/models';
import { SpinnerComponent } from '@app/shared/ui/spinner/spinner.component';
import { PageHeaderComponent } from '@app/shared/ui/page-header/page-header.component';

// Maps index in the statuses array to the GLPI status code used by the kanban board
const GLPI_CODES = [1, 2, 5] as const;

@Component({
  selector: 'app-settings-kanban',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    SpinnerComponent,
    PageHeaderComponent,
  ],
  templateUrl: './kanban-configuration.component.html',
  styleUrl: './kanban-configuration.component.css',
})
export class KanbanConfigurationComponent implements OnInit {
  private readonly ticketStatusService = inject(TicketStatusService);
  private readonly kanbanSettings      = inject(KanbanSettingsService);
  private readonly toast               = inject(ToastService);

  readonly statuses = signal<TicketStatus[]>([]);
  readonly loading  = signal(true);
  readonly saving   = signal(false);

  async ngOnInit(): Promise<void> {
    try {
      this.statuses.set(await this.ticketStatusService.getStatuses());
    } catch {
      this.toast.error('Erreur de chargement des statuts.');
    } finally {
      this.loading.set(false);
    }
  }

  setColor(index: number, color: string): void {
    this.statuses.update(list =>
      list.map((s, i) => i === index ? { ...s, color } : s)
    );
  }

  setName(statusIndex: number, nameIndex: number, name: string): void {
    this.statuses.update(list =>
      list.map((s, si) => {
        if (si !== statusIndex) return s;
        return {
          ...s,
          names: s.names.map((n, ni) => ni === nameIndex ? { ...n, name } : n),
        };
      })
    );
  }

  async saveAll(): Promise<void> {
    this.saving.set(true);
    try {
      const updated = await Promise.all(
        this.statuses().map(s => this.ticketStatusService.updateStatus(s))
      );
      this.statuses.set(updated);
      this.syncToLocal(updated);
      this.toast.success('Configuration kanban sauvegardée.');
    } catch {
      this.toast.error('Erreur lors de la sauvegarde.');
    } finally {
      this.saving.set(false);
    }
  }

  private syncToLocal(statuses: TicketStatus[]): void {
    const existing = this.kanbanSettings.columns();
    const columns: KanbanColumn[] = statuses.map((s, i) => {
      const prev = existing.find(c => c.statusCode === GLPI_CODES[i]);
      const frName = s.names.find(n => /^fr/i.test(n.language.name))?.name ?? prev?.labelFr ?? '';
      const mgName = s.names.find(n => /^mg|malagasy/i.test(n.language.name))?.name ?? prev?.labelMg ?? '';
      return {
        statusCode: GLPI_CODES[i],
        labelFr: frName,
        labelMg: mgName,
        color: s.color,
      };
    });
    this.kanbanSettings.save(columns);
  }
}
