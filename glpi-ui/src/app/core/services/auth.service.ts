import { Injectable, signal, computed } from '@angular/core';

export interface AuthUser {
  id: number;
  name: string;
  role: 'admin' | 'user';
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly user = signal<AuthUser | null>(null);

  readonly currentUser  = this.user.asReadonly();
  readonly isLoggedIn   = computed(() => this.user() !== null);
  readonly isAdmin      = computed(() => this.user()?.role === 'admin');

  login(user: AuthUser): void {
    this.user.set(user);
  }

  logout(): void {
    this.user.set(null);
  }
}
