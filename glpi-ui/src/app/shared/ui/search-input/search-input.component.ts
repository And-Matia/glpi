import { Component, input, output, model, ChangeDetectionStrategy } from '@angular/core';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-search-input',
  templateUrl: './search-input.component.html',
  styleUrl: './search-input.component.css',
  standalone: true
})
export class SearchInputComponent {
  placeholder = input<string>('Rechercher…');
  value       = model<string>('');
  disabled    = input<boolean>(false);

  search = output<string>();

  onInput(event: Event): void {
    const val = (event.target as HTMLInputElement).value;
    this.value.set(val);
    this.search.emit(val);
  }
}
