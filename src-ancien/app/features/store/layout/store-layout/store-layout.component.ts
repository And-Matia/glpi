import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from '../navbar/navbar.component';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,

  selector: 'app-store-layout',
  imports: [RouterOutlet, NavbarComponent],
  templateUrl: './store-layout.component.html',
  styleUrl: './store-layout.component.css',
})
export class StoreLayoutComponent {}
