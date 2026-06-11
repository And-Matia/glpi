import {Component, ChangeDetectionStrategy, inject, signal} from '@angular/core';
import {EntityStatus, ResetService} from '@app/core/services/glpi/reset.service';
import {ToastService} from '@app/core/services/toast.service';
import {MatButtonModule} from '@angular/material/button';
import {ConfirmDialogComponent} from '@app/shared/ui/confirm-dialog/confirm-dialog.component';
import {PageHeaderComponent} from '@app/shared/ui/page-header/page-header.component';
import {BadgeComponent, BadgeVariant} from '@app/shared/ui/badge/badge.component';
import {ProgressBarComponent, ProgressVariant} from '@app/shared/ui/progress-bar/progress-bar.component';
import {TableColumn, TableComponent} from '@app/shared/ui/table/table.component';
import {TableCellDirective} from '@app/shared/ui/table/table-cell.directive';

@Component({
  selector: 'app-reset',
  imports: [MatButtonModule, ConfirmDialogComponent, PageHeaderComponent, BadgeComponent, ProgressBarComponent,TableComponent,TableCellDirective],
  templateUrl: './reset.component.html',
  styleUrl: './reset.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResetComponent {
  private readonly resetService = inject(ResetService);
  private readonly toast = inject(ToastService);

  readonly confirmOpen = signal(false);
  readonly loading = signal(false);
  readonly success = signal(false);
  readonly error = signal('');

  readonly columns: TableColumn[] = [
    { key: 'label',    label: 'Entité',      width: '220px' },
    { key: 'status',   label: 'Statut',      width: '160px' },
    { key: 'progress', label: 'Progression'                  },
  ];

  readonly progress = this.resetService.progress;

  openConfirmDialog(): void {
    this.confirmOpen.set(true);
  }

  onCancelled(): void {
    this.confirmOpen.set(false);
  }

  statusVariant(status: EntityStatus): BadgeVariant {
    const map: Record<EntityStatus, BadgeVariant> = {
      deleting: 'warning',
      done: 'success',
      error: 'danger',
      fetching: 'info',
      idle: 'neutral'
    };
    return map[status];
  }

  progressVariant(stats: EntityStatus): ProgressVariant {
    if (stats === 'done') return 'success';
    if (stats === 'error') return 'danger';
    return 'warning';
  }

  onConfirmed(): void {
    this.confirmOpen.set(false);
    this.loading.set(true);
    this.success.set(false);
    this.error.set('');

    this.resetService.resetAllWithTrash()
      .then(() => {
        this.loading.set(false);
        this.success.set(true);
        this.toast.success('Données réinitialisées avec succès');
      })
      .catch((err: Error) => {
        this.loading.set(false);
        this.error.set(err.message ?? 'Erreur lors de la réinitialisation');
        this.toast.error('Erreur lors de la réinitialisation');
      });
  }
}
