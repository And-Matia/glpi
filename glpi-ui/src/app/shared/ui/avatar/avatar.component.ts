import { Component, input, computed, ChangeDetectionStrategy } from '@angular/core';

export type AvatarSize = 'sm' | 'md' | 'lg' | 'xl';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-avatar',
  templateUrl: './avatar.component.html',
  styleUrl: './avatar.component.css',
})
export class AvatarComponent {
  name  = input<string>('');
  src   = input<string>('');
  size  = input<AvatarSize>('md');

  readonly initials = computed(() => {
    const parts = this.name().trim().split(' ').filter(Boolean);
    if (parts.length === 0) return '?';
    if (parts.length === 1) return parts[0][0].toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  });
}
