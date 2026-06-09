import { Component, input, ChangeDetectionStrategy } from '@angular/core';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-divider',
  templateUrl: './divider.component.html',
  styleUrl: './divider.component.css',
  standalone: true
})
export class DividerComponent {
  label = input<string>('');
}
