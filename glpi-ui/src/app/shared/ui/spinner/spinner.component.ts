import { Component, input, ChangeDetectionStrategy } from '@angular/core';

export type SpinnerSize = 'sm' | 'md' | 'lg';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-spinner',
  templateUrl: './spinner.component.html',
  styleUrl: './spinner.component.css',
})
export class SpinnerComponent {
  size = input<SpinnerSize>('md');
}
