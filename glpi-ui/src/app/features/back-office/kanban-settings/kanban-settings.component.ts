import { Component, ChangeDetectionStrategy, inject, signal, OnInit } from '@angular/core';
import { KanbanSettingsService, KanbanColumn } from '@app/core/services/kanban-settings.service';
import { ToastService } from '@app/core/services/toast.service';
import { ButtonComponent } from '@app/shared/ui/button/button.component';
import { InputComponent } from '@app/shared/ui/input/input.component';
import { PageHeaderComponent } from '@app/shared/ui/page-header/page-header.component';
import { CardComponent } from '@app/shared/ui/card/card.component';

@Component({
  selector: 'app-kanban-settings',
  imports: [ButtonComponent, InputComponent, PageHeaderComponent, CardComponent],
  templateUrl: './kanban-settings.component.html',
  styleUrl: './kanban-settings.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true
})
export class KanbanSettingsComponent implements OnInit {
  private readonly svc   = inject(KanbanSettingsService);
  private readonly toast = inject(ToastService);

  readonly columns = signal<KanbanColumn[]>([]);

  ngOnInit(): void {
    this.columns.set(this.svc.columns().map(c => ({ ...c })));
  }

  updateLabel(index: number, value: string): void {
    this.columns.update(cols => {
      const next = [...cols];
      next[index] = { ...next[index], labelMg: value };
      return next;
    });
  }

  updateColor(index: number, value: string): void {
    this.columns.update(cols => {
      const next = [...cols];
      next[index] = { ...next[index], color: value };
      return next;
    });
  }

  save(): void {
    this.svc.save(this.columns());
    this.toast.success('Paramètres sauvegardés.');
  }

  reset(): void {
    this.svc.reset();
    this.columns.set(this.svc.columns().map(c => ({ ...c })));
    this.toast.info('Paramètres réinitialisés.');
  }
}
