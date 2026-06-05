// CardComponent — reusable content card with title, optional subtitle, and body slot
import { Component, input, ChangeDetectionStrategy } from '@angular/core';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,

  selector: 'app-card',
  templateUrl: './card.component.html',
  styleUrl: './card.component.css',
})
export class CardComponent {
  title = input.required<string>();
  subtitle = input<string>();
}
