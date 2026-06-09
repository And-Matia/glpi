import { Component, input, model, ChangeDetectionStrategy } from '@angular/core';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-switch',
  templateUrl: './switch.component.html',
  styleUrl: './switch.component.css',
  standalone: true
})
export class SwitchComponent {
  label    = input<string>('');
  disabled = input<boolean>(false);

  /** Two-way bound — use [(checked)]="myVar". */
  checked = model<boolean>(false);

  toggle(): void {
    if (!this.disabled()) this.checked.update(v => !v);
  }
}
