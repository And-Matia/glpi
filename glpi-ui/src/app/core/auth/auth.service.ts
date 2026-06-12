import { Injectable, signal } from '@angular/core';
import {environment} from '../../../environment';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly loggedIn = signal(localStorage.getItem('backOfficeAuth') !== null);

  readonly isLoggedIn   = this.loggedIn.asReadonly();

  login(code: string): boolean {
    if (code === environment.backOfficePassword) {
      localStorage.setItem('backOfficeAuth', '1');
      this.loggedIn.set(true);
      return true;
    }
    return false;
  }

  logout(): void {
    localStorage.removeItem('backOfficeAuth');
    this.loggedIn.set(false)
  }
}
