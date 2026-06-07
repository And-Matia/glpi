import { Component, input, output, ChangeDetectionStrategy } from '@angular/core';

export type IconButtonVariant = 'ghost' | 'primary' | 'danger';
export type IconButtonSize    = 'sm' | 'md';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-icon-button',
  templateUrl: './icon-button.component.html',
  styleUrl: './icon-button.component.css',
})
export class IconButtonComponent {
  icon      = input.required<string>();
  variant   = input<IconButtonVariant>('ghost');
  size      = input<IconButtonSize>('md');
  disabled  = input<boolean>(false);
  ariaLabel = input<string>('');

  clicked = output<void>();

  onClick(): void {
    if (!this.disabled()) this.clicked.emit();
  }
}
