import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { ResetService } from '@app/core/services/glpi/reset.service';
import { ToastService } from '@app/core/services/toast.service';
import { ButtonComponent } from '@app/shared/ui/button/button.component';
import { ConfirmDialogComponent } from '@app/shared/ui/confirm-dialog/confirm-dialog.component';
import { PageHeaderComponent } from '@app/shared/ui/page-header/page-header.component';

@Component({
  selector: 'app-reset',
  imports: [ButtonComponent, ConfirmDialogComponent, PageHeaderComponent],
  templateUrl: './reset.component.html',
  styleUrl: './reset.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResetComponent {
  private readonly resetService = inject(ResetService);
  private readonly toast        = inject(ToastService);

  readonly confirmOpen = signal(false);
  readonly loading     = signal(false);
  readonly success     = signal(false);
  readonly error       = signal('');

  openConfirm(): void {
    this.confirmOpen.set(true);
  }

  onCancelled(): void {
    this.confirmOpen.set(false);
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
