import { Component, input, computed, ChangeDetectionStrategy } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';

export type AvatarSize = 'sm' | 'md' | 'lg' | 'xl';

const SIZE_PX: Record<AvatarSize, number> = { sm: 28, md: 36, lg: 48, xl: 64 };

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-avatar',
  templateUrl: './avatar.component.html',
  styleUrl: './avatar.component.css',
  standalone: true,
  imports: [NgOptimizedImage],
})
export class AvatarComponent {
  name  = input<string>('');
  src   = input<string>('');
  size  = input<AvatarSize>('md');

  readonly pixelSize = computed(() => SIZE_PX[this.size()]);

  readonly initials = computed(() => {
    // Coerce defensively: callers may bind a non-string (e.g. a numeric id).
    const parts = String(this.name() ?? '').trim().split(' ').filter(Boolean);
    if (parts.length === 0) return '?';
    if (parts.length === 1) return parts[0][0].toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  });
}
