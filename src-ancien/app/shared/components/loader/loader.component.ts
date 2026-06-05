// LoaderComponent — centered CSS spinner with three size options
import { Component, input, ChangeDetectionStrategy } from '@angular/core';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,

  selector: 'app-loader',
  templateUrl: './loader.component.html',
  styleUrl: './loader.component.css',
})
export class LoaderComponent {
  size = input<'sm' | 'md' | 'lg'>('md');
}
