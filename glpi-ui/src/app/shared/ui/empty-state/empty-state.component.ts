import { Component, input, ChangeDetectionStrategy } from '@angular/core';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-empty-state',
  templateUrl: './empty-state.component.html',
  styleUrl: './empty-state.component.css',
  standalone: true
})
export class EmptyStateComponent {
  icon    = input<string>('fa-solid fa-inbox');
  title   = input<string>('Aucun résultat');
  message = input<string>('');
}
