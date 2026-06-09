import { Component, input, ChangeDetectionStrategy } from '@angular/core';

export type BadgeVariant = 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'neutral';
export type BadgeSize    = 'sm' | 'md';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-badge',
  templateUrl: './badge.component.html',
  styleUrl: './badge.component.css',
  standalone: true
})
export class BadgeComponent {
  variant = input<BadgeVariant>('neutral');
  size    = input<BadgeSize>('md');
}
