import { Component, input, computed, ChangeDetectionStrategy } from '@angular/core';

export type ProgressVariant = 'primary' | 'success' | 'warning' | 'danger' | 'info';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-progress-bar',
  templateUrl: './progress-bar.component.html',
  styleUrl: './progress-bar.component.css',
  standalone: true
})
export class ProgressBarComponent {
  value     = input<number>(0);
  max       = input<number>(100);
  variant   = input<ProgressVariant>('primary');
  showLabel = input<boolean>(false);

  readonly percent = computed(() => {
    const max = this.max() || 1;
    return Math.max(0, Math.min(100, Math.round((this.value() / max) * 100)));
  });
}
