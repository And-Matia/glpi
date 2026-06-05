// InputComponent — labeled text input with optional error message and two-way binding
import { Component, input, model, ChangeDetectionStrategy, effect } from '@angular/core';
import { ReactiveFormsModule, FormControl } from '@angular/forms';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,

  selector: 'app-input',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './input.component.html',
  styleUrl: './input.component.css',
})
export class InputComponent {
  label = input.required<string>();
  placeholder = input<string>('');
  errorMessage = input<string>('');
  type = input<string>('text');

  // Two-way bound value — use [(value)]="myVar" in parent
  value = model<string>('');

  control = new FormControl('', { nonNullable: true });

  constructor() {
    this.control.valueChanges.subscribe(val => {
      if (this.value() !== val) {
        this.value.set(val);
      }
    });

    effect(() => {
      const val = this.value();
      if (this.control.value !== val) {
        this.control.setValue(val, { emitEvent: false });
      }
    });
  }
}