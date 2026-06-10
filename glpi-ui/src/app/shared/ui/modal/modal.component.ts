import { Component, input, output, effect, inject, ChangeDetectionStrategy } from '@angular/core';
import { A11yModule } from '@angular/cdk/a11y';
import { Overlay } from '@angular/cdk/overlay';

export type ModalSize = 'sm' | 'md' | 'lg' | 'xl';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-modal',
  standalone: true,
  imports: [A11yModule],
  templateUrl: './modal.component.html',
  styleUrl: './modal.component.css',
})
export class ModalComponent {
  open  = input.required<boolean>();
  title = input<string>('');
  size  = input<ModalSize>('md');

  closed = output<void>();

  private readonly scrollStrategy = inject(Overlay).scrollStrategies.block();

  constructor() {
    effect(() => {
      this.open() ? this.scrollStrategy.enable() : this.scrollStrategy.disable();
    });
  }

  onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('modal-backdrop')) {
      this.closed.emit();
    }
  }
}
