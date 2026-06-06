import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from '../sidebar/sidebar.component';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,

  selector: 'app-admin-layout',
  imports: [RouterOutlet, SidebarComponent],
  templateUrl: './back-office-layout.component.html',
  styleUrl: './back-office-layout.component.css',
})
export class BackOfficeLayoutComponent {}
