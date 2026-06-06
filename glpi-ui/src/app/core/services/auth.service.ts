import { Injectable, signal, computed } from '@angular/core';
import {environment} from '../../../environment';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly user = signal<string | null>(localStorage.getItem('backOfficePassword') );

  readonly isLoggedIn   = computed(() => this.user() !== null);

  login(code: string): boolean {
    if (code === environment.backOfficePassword) {
      localStorage.setItem('backOfficePassword', code);
      this.user.set(code)
      return true;
    }
    return false;
  }

  logout(): void {
    localStorage.removeItem('backOfficePassword');
    this.user.set(null);
  }
}
