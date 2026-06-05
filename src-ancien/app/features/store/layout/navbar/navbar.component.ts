import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CartService } from '@app/features/store/cart/cart.service';
import { UserSessionService } from '@app/features/store/services/user-session.service';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,

  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css',
})
export class NavbarComponent {
  readonly cartService = inject(CartService);
  readonly userSession = inject(UserSessionService);
}
