import { Component, input, model, ChangeDetectionStrategy } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';

export interface SelectOption {
  value: string | number;
  label: string;
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-select',
  standalone: true,
  imports: [MatFormFieldModule, MatSelectModule],
  templateUrl: './select.component.html',
  styleUrl: './select.component.css',
})
export class SelectComponent {
  label        = input.required<string>();
  options      = input.required<SelectOption[]>();
  placeholder  = input<string>('Sélectionner…');
  errorMessage = input<string>('');

  value = model<string | number | null>(null);
}
