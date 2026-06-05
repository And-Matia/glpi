import { Component, input, output, ChangeDetectionStrategy } from '@angular/core';

export type ModalSize = 'sm' | 'md' | 'lg' | 'xl';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-modal',
  templateUrl: './modal.component.html',
  styleUrl: './modal.component.css',
})
export class ModalComponent {
  open  = input.required<boolean>();
  title = input<string>('');
  size  = input<ModalSize>('md');

  closed = output<void>();

  onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('modal-backdrop')) {
      this.closed.emit();
    }
  }
}
