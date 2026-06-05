import { Component, input, model, ChangeDetectionStrategy } from '@angular/core';

export interface Tab {
  key: string;
  label: string;
  icon?: string;
  badge?: string | number;
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-tabs',
  templateUrl: './tabs.component.html',
  styleUrl: './tabs.component.css',
})
export class TabsComponent {
  tabs = input.required<Tab[]>();

  activeKey = model.required<string>();
}
