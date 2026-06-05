import { Injectable, signal } from '@angular/core';

export interface SessionUser {
  id: number;
  name: string;
  city: string;
}

const STORAGE_KEY = 'store_selected_user';

@Injectable({ providedIn: 'root' })
export class UserSessionService {
  private readonly _user = signal<SessionUser | null>(this.load());

  readonly currentUser = this._user.asReadonly();

  selectUser(user: SessionUser | null): void {
    this._user.set(user);
    if (user) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }

  private load(): SessionUser | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as SessionUser) : null;
    } catch {
      return null;
    }
  }
}
