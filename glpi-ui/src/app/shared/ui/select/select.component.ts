import { Component, input, model, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';

export interface SelectOption {
  value: string | number;
  label: string;
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-select',
  templateUrl: './select.component.html',
  styleUrl: './select.component.css',
  imports: [FormsModule],
  standalone: true
})
export class SelectComponent {
  label        = input.required<string>();
  options      = input.required<SelectOption[]>();
  placeholder  = input<string>('Sélectionner…');
  errorMessage = input<string>('');

  value = model<string | number | null>(null);
}
