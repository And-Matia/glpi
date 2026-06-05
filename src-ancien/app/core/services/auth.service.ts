import { Injectable, computed, signal, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { PsConfigService } from '../config/ps-config.service';
export interface AdminSession {
  username: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly SESSION_KEY = 'admin-session';
  private readonly configService = inject(PsConfigService);

  private readonly _session = signal<AdminSession | null>(this.loadSession());
  readonly isLoggedIn = computed(() => this._session() !== null);

  login(username: string, password: string): Observable<AdminSession | null> {
    const { username: validUser, password: validPass } = this.configService.appConfig.admin;

    if (username !== validUser || password !== validPass) {
      return of(null);
    }

    const session: AdminSession = { username };
    this.saveSession(session);
    this._session.set(session);
    return of(session);
  }

  logout(): void {
    localStorage.removeItem(this.SESSION_KEY);
    this._session.set(null);
  }

  private saveSession(session: AdminSession): void {
    localStorage.setItem(this.SESSION_KEY, JSON.stringify(session));
  }

  private loadSession(): AdminSession | null {
    try {
      const raw = localStorage.getItem(this.SESSION_KEY);
      return raw ? (JSON.parse(raw) as AdminSession) : null;
    } catch {
      return null;
    }
  }
}
