import { Component, signal, inject, ChangeDetectionStrategy } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '@app/core/auth/auth.service';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,

  selector: 'app-sidebar',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css',
  standalone: true
})
export class SidebarComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  isOpen = signal(true);

  toggle(): void {
    this.isOpen.set(!this.isOpen());
  }

  logout() : void {
    this.auth.logout();
    this.router.navigate(['/back-office/login']);
  }
}
