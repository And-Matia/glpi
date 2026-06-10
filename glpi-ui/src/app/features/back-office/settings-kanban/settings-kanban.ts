import { Component, OnInit, inject, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { KanbanSettingsService, KanbanColumn } from '@app/core/services/kanban-settings.service';
import { ToastService } from '@app/core/services/toast.service';

@Component({
  selector: 'app-settings-kanban',
  imports: [],
  templateUrl: './settings-kanban.html',
  styleUrl: './settings-kanban.css',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsKanban implements OnInit {
  private readonly svc   = inject(KanbanSettingsService);
  private readonly toast = inject(ToastService);

  readonly columns     = signal<KanbanColumn[]>([]);
  readonly selectedCode = signal<number>(0);

  readonly selectedColumn = computed(() =>
    this.columns().find(c => c.statusCode === this.selectedCode()) ?? null
  );

  ngOnInit(): void {
    const cols = this.svc.columns().map(c => ({ ...c }));
    this.columns.set(cols);
    if (cols.length) this.selectedCode.set(cols[0].statusCode);
  }

  onSelectChange(value: string): void {
    this.selectedCode.set(Number(value));
  }

  updateColor(color: string): void {
    this.columns.update(cols =>
      cols.map(c => c.statusCode === this.selectedCode() ? { ...c, color } : c)
    );
  }

  updateLabelMg(labelMg: string): void {
    this.columns.update(cols =>
      cols.map(c => c.statusCode === this.selectedCode() ? { ...c, labelMg } : c)
    );
  }

  save(): void {
    this.svc.save(this.columns());
    this.toast.success('Paramètres sauvegardés.');
  }
}
