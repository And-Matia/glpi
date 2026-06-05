import { Component, input, output, ChangeDetectionStrategy } from '@angular/core';
import { ButtonComponent } from '@app/shared/ui/button/button.component';
import { ModalComponent } from '@app/shared/ui/modal/modal.component';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-confirm-dialog',
  templateUrl: './confirm-dialog.component.html',
  styleUrl: './confirm-dialog.component.css',
  imports: [ModalComponent, ButtonComponent],
})
export class ConfirmDialogComponent {
  open          = input.required<boolean>();
  title         = input<string>('Confirmer');
  message       = input<string>('Êtes-vous sûr de vouloir continuer ?');
  confirmLabel  = input<string>('Confirmer');
  cancelLabel   = input<string>('Annuler');
  danger        = input<boolean>(false);

  confirmed = output<void>();
  cancelled = output<void>();
}
