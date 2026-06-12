import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from '../navbar/navbar.component';

@Component({
  selector: 'app-front-office-layout',
  imports: [RouterOutlet, NavbarComponent],
  templateUrl: './front-office-layout.component.html',
  styleUrl: './front-office-layout.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FrontOfficeLayoutComponent {}
