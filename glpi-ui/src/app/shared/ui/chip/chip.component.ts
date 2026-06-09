import { Component, input, output, ChangeDetectionStrategy } from '@angular/core';

export type ChipVariant = 'neutral' | 'primary' | 'success' | 'warning' | 'danger' | 'info';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-chip',
  templateUrl: './chip.component.html',
  styleUrl: './chip.component.css',
  standalone: true
})
export class ChipComponent {
  variant   = input<ChipVariant>('neutral');
  icon      = input<string>('');
  removable = input<boolean>(false);

  removed = output<void>();
}
