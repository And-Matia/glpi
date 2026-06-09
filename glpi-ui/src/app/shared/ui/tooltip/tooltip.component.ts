import { Component, input, ChangeDetectionStrategy } from '@angular/core';

export type TooltipPosition = 'top' | 'bottom' | 'left' | 'right';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-tooltip',
  templateUrl: './tooltip.component.html',
  styleUrl: './tooltip.component.css',
  standalone: true
})
export class TooltipComponent {
  text     = input.required<string>();
  position = input<TooltipPosition>('top');
}
