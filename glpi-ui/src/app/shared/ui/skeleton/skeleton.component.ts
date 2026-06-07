import { Component, input, ChangeDetectionStrategy } from '@angular/core';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-skeleton',
  templateUrl: './skeleton.component.html',
  styleUrl: './skeleton.component.css',
})
export class SkeletonComponent {
  width  = input<string>('100%');
  height = input<string>('1rem');
  /** Render as a circle (e.g. avatar placeholder). */
  circle = input<boolean>(false);
}
