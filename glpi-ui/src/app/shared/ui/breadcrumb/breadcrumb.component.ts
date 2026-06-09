import { Component, input, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';

export interface BreadcrumbItem {
  label: string;
  /** Router link; omit for the current (last) item. */
  link?: string | any[];
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-breadcrumb',
  templateUrl: './breadcrumb.component.html',
  styleUrl: './breadcrumb.component.css',
  imports: [RouterLink],
  standalone: true
})
export class BreadcrumbComponent {
  items = input.required<BreadcrumbItem[]>();
}
