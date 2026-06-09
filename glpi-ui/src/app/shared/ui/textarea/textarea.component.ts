import { Component, input, model, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-textarea',
  templateUrl: './textarea.component.html',
  styleUrl: './textarea.component.css',
  imports: [FormsModule],
  standalone: true
})
export class TextareaComponent {
  label        = input.required<string>();
  placeholder  = input<string>('');
  errorMessage = input<string>('');
  rows         = input<number>(4);

  value = model<string>('');
}
