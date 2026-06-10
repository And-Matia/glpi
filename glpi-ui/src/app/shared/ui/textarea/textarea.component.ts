import { Component, input, model, ChangeDetectionStrategy } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-textarea',
  standalone: true,
  imports: [MatFormFieldModule, MatInputModule],
  templateUrl: './textarea.component.html',
  styleUrl: './textarea.component.css',
})
export class TextareaComponent {
  label        = input.required<string>();
  placeholder  = input<string>('');
  errorMessage = input<string>('');
  rows         = input<number>(4);

  value = model<string>('');
}
