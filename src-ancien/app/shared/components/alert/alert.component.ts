// AlertComponent — colored banner for success, warning, error, or info messages
import { Component, input, computed, ChangeDetectionStrategy } from '@angular/core';

type AlertType = 'success' | 'warning' | 'error' | 'info';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,

  selector: 'app-alert',
  templateUrl: './alert.component.html',
  styleUrl: './alert.component.css',
})
export class AlertComponent {
  type = input<AlertType>('info');

  // Maps each alert type to a Font Awesome icon class
  iconClass = computed(() => {
    const icons: Record<AlertType, string> = {
      success: 'fa-solid fa-check',
      warning: 'fa-solid fa-triangle-exclamation',
      error: 'fa-solid fa-xmark',
      info: 'fa-solid fa-circle-info',
    };
    return icons[this.type()];
  });
}
