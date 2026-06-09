import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { ToastService } from '@app/core/services/toast.service';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-toast',
  templateUrl: './toast.component.html',
  styleUrl: './toast.component.css',
  standalone: true
})
export class ToastComponent {
  protected readonly toastService = inject(ToastService);

  toastIcon(variant: string): string {
    const icons: Record<string, string> = {
      success: 'fa-solid fa-circle-check',
      danger:  'fa-solid fa-circle-xmark',
      warning: 'fa-solid fa-triangle-exclamation',
      info:    'fa-solid fa-circle-info',
    };
    return icons[variant] ?? icons['info'];
  }
}
