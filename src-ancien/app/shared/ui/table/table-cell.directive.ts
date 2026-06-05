import { Directive, inject, input, TemplateRef } from '@angular/core';

@Directive({ selector: '[appCell]', standalone: true })
export class TableCellDirective {
  key      = input.required<string>({ alias: 'appCell' });
  readonly template = inject(TemplateRef<{ $implicit: Record<string, any>; value: any }>);
}
