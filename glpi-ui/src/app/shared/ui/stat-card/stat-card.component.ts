import { Component, input, ChangeDetectionStrategy } from '@angular/core';

export type StatCardVariant = 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'neutral';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-stat-card',
  templateUrl: './stat-card.component.html',
  styleUrl: './stat-card.component.css',
})
export class StatCardComponent {
  label   = input<string>('');
  value   = input<string | number>('');
  icon    = input<string>('');
  variant = input<StatCardVariant>('neutral');
}
