import { Component, input, output, signal, computed, ChangeDetectionStrategy } from '@angular/core';

export type AlertVariant = 'success' | 'danger' | 'warning' | 'info';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-alert',
  templateUrl: './alert.component.html',
  styleUrl: './alert.component.css',
})
export class AlertComponent {
  variant     = input<AlertVariant>('info');
  title       = input<string>('');
  /** Override the default icon for the variant (FontAwesome classes). */
  icon        = input<string>('');
  dismissible = input<boolean>(false);

  dismissed = output<void>();

  readonly visible = signal(true);

  readonly resolvedIcon = computed(() => {
    if (this.icon()) return this.icon();
    const map: Record<AlertVariant, string> = {
      success: 'fa-solid fa-circle-check',
      danger:  'fa-solid fa-circle-xmark',
      warning: 'fa-solid fa-triangle-exclamation',
      info:    'fa-solid fa-circle-info',
    };
    return map[this.variant()];
  });

  dismiss(): void {
    this.visible.set(false);
    this.dismissed.emit();
  }
}
