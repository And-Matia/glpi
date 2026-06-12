# 15 — Permissions & Authentification Backoffice

> Code unique, route guard, rôles multiples, bandeau mode protégé, élévation de privilège à la volée, journalisation.

---

## 1. Auth Service — Code Unique

```typescript
// core/services/auth.service.ts (tel qu'existant dans le projet)
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly USER_KEY = 'back-office-user';
  private readonly ELEV_KEY = 'back-office-elevation';

  readonly user       = signal<string | null>(this.loadUser());
  readonly isLoggedIn = computed(() => this.user() !== null);

  // Rôles : 'readonly' | 'operator' | 'admin'
  readonly role = computed(() => {
    const u = this.user();
    if (!u) return null;
    // Décoder le rôle depuis le user stocké (ou le coder dans le password)
    if (u === 'admin')    return 'admin' as const;
    if (u === 'operator') return 'operator' as const;
    return 'readonly' as const;
  });

  login(code: string): boolean {
    // Mapper code → rôle
    const codeMap: Record<string, string> = {
      [environment.adminCode]:    'admin',
      [environment.operatorCode]: 'operator',
      [environment.readonlyCode]: 'readonly',
    };
    const role = codeMap[code];
    if (!role) return false;

    localStorage.setItem(this.USER_KEY, role);
    this.user.set(role);
    return true;
  }

  logout(): void {
    localStorage.removeItem(this.USER_KEY);
    localStorage.removeItem(this.ELEV_KEY);
    this.user.set(null);
  }

  // Élévation temporaire
  elevate(code: string): boolean {
    if (code !== environment.adminCode) return false;
    const expiry = Date.now() + 5 * 60_000; // 5 minutes
    localStorage.setItem(this.ELEV_KEY, String(expiry));
    return true;
  }

  isElevated(): boolean {
    const raw = localStorage.getItem(this.ELEV_KEY);
    if (!raw) return false;
    const expiry = parseInt(raw);
    if (Date.now() > expiry) {
      localStorage.removeItem(this.ELEV_KEY);
      return false;
    }
    return true;
  }

  private loadUser(): string | null {
    return localStorage.getItem(this.USER_KEY);
  }
}
```

---

## 2. Route Guard

```typescript
// core/guards/auth.guard.ts
export const authGuard: CanActivateFn = () => {
  const auth   = inject(AuthService);
  const router = inject(Router);

  if (auth.isLoggedIn()) return true;
  return router.createUrlTree(['/back-office/login']);
};

// Appliquer dans les routes
{
  path: 'back-office',
  canActivate: [authGuard],
  children: [
    { path: 'dashboard', loadComponent: () => import('./dashboard/...') },
    // …
  ]
}
```

---

## 3. Page Login — Code Unique

```typescript
export class LoginComponent {
  private readonly auth   = inject(AuthService);
  private readonly router = inject(Router);
  private readonly toast  = inject(ToastService);

  readonly code        = signal(environment.backOfficePassword); // pré-rempli
  readonly codeVisible = signal(false);
  readonly error       = signal('');
  readonly attempts    = signal(0);
  readonly lockedUntil = signal<number | null>(null);

  readonly isLocked = computed(() =>
    this.lockedUntil() !== null && Date.now() < this.lockedUntil()!
  );

  onSubmit(): void {
    if (this.isLocked()) return;

    if (!this.auth.login(this.code())) {
      this.error.set('Code incorrect');
      this.attempts.update(n => n + 1);

      if (this.attempts() >= 5) {
        this.lockedUntil.set(Date.now() + 5 * 60_000); // 5 min
        this.error.set('Trop de tentatives. Réessayez dans 5 minutes.');
        setTimeout(() => this.lockedUntil.set(null), 5 * 60_000);
      }
      return;
    }
    this.router.navigate(['/back-office/dashboard']);
  }
}
```

```html
<div class="login-page">
  <mat-card class="login-card">
    <mat-card-header>
      <mat-card-title>Accès Back-office</mat-card-title>
    </mat-card-header>
    <mat-card-content>
      @if (isLocked()) {
        <app-alert variant="danger" title="Accès temporairement bloqué">
          Trop de tentatives incorrectes. Réessayez dans quelques minutes.
        </app-alert>
      }

      <div class="code-field-row">
        <app-input
          [label]="'Code d\'accès'"
          [type]="codeVisible() ? 'text' : 'password'"
          [(value)]="code"
          [errorMessage]="error()"
        />
        <button mat-icon-button
                (click)="codeVisible.update(v => !v)"
                [attr.aria-label]="codeVisible() ? 'Masquer' : 'Afficher'">
          <i [class]="codeVisible() ? 'fa-solid fa-eye-slash' : 'fa-solid fa-eye'"></i>
        </button>
      </div>

      <button mat-flat-button class="login-btn"
              [disabled]="!code().trim() || isLocked()"
              (click)="onSubmit()">
        Accéder
      </button>
    </mat-card-content>
  </mat-card>
</div>
```

---

## 4. Bandeau Mode Protégé

Visible sur toutes les pages sensibles.

```html
<!-- Dans le layout back-office -->
<div class="protected-banner" [class]="'role-' + auth.role()">
  <i class="fa-solid fa-shield-halved"></i>
  <span>Mode protégé — {{ roleLabel() }}</span>
  <button mat-button (click)="openChangeCode()">
    <i class="fa-solid fa-key"></i> Changer de code
  </button>
  <button mat-button (click)="logout()">
    <i class="fa-solid fa-right-from-bracket"></i> Déconnecter
  </button>
</div>
```

```typescript
readonly auth = inject(AuthService);
readonly router = inject(Router);

roleLabel(): string {
  switch (this.auth.role()) {
    case 'admin':    return 'Administrateur';
    case 'operator': return 'Opérateur';
    case 'readonly': return 'Lecture seule';
    default:         return '';
  }
}

logout(): void {
  this.auth.logout();
  this.router.navigate(['/back-office/login']);
}
```

```css
.protected-banner {
  display: flex;
  align-items: center;
  gap: var(--spacing-3);
  padding: var(--spacing-2) var(--spacing-4);
  font-size: var(--text-13);
}
.protected-banner.role-admin    { background: #fff3cd; color: #856404; }
.protected-banner.role-operator { background: #d1ecf1; color: #0c5460; }
.protected-banner.role-readonly { background: var(--color-surface); color: var(--color-text-muted); }
```

---

## 5. Affichage Conditionnel selon le Rôle

```typescript
// Dans un composant
readonly auth = inject(AuthService);

canDelete(): boolean {
  return this.auth.role() === 'admin';
}

canEdit(): boolean {
  const r = this.auth.role();
  return r === 'admin' || r === 'operator';
}
```

```html
<!-- Masquer les actions non autorisées -->
@if (canEdit()) {
  <button mat-icon-button (click)="openEdit(row)">
    <i class="fa-solid fa-pen"></i>
  </button>
}

@if (canDelete()) {
  <button mat-icon-button color="warn" (click)="openDelete(row.id)">
    <i class="fa-solid fa-trash"></i>
  </button>
}

<!-- Désactiver avec tooltip explicatif -->
<button mat-flat-button
        [disabled]="!canDelete()"
        [matTooltip]="canDelete() ? '' : 'Action réservée aux administrateurs'">
  Supprimer
</button>
```

**Important** : l'affichage conditionnel n'est pas suffisant. Vérifier aussi le rôle dans le handler :

```typescript
async deleteItem(id: number): Promise<void> {
  if (!this.canDelete()) {
    this.toast.error('Accès refusé');
    return;
  }
  // … continuer
}
```

---

## 6. Élévation à la Volée (Re-auth)

Demander le code admin même si déjà connecté.

```typescript
readonly elevOpen       = signal(false);
readonly elevCode       = signal('');
readonly elevCodeVisible = signal(false);
readonly elevError      = signal('');
private pendingElevAction: (() => Promise<void>) | null = null;

requireElevation(action: () => Promise<void>): void {
  if (this.auth.isElevated()) {
    // Déjà élevé → exécuter directement
    action();
    return;
  }
  this.pendingElevAction = action;
  this.elevCode.set('');
  this.elevError.set('');
  this.elevOpen.set(true);
}

async confirmElevation(): Promise<void> {
  const code = this.elevCode().trim();
  if (!this.auth.elevate(code)) {
    this.elevError.set('Code admin incorrect');
    return;
  }
  // Journaliser l'élévation
  this.logService.record('elevation', 'Admin elevation granted');
  this.elevOpen.set(false);
  if (this.pendingElevAction) {
    await this.pendingElevAction();
    this.pendingElevAction = null;
  }
}

// Exemples d'utilisation :
resetAll(): void {
  this.requireElevation(async () => {
    await this.resetService.resetAll();
    this.toast.success('Données réinitialisées');
  });
}

bulkDelete(ids: number[]): void {
  this.requireElevation(async () => {
    for (const id of ids) await this.service.delete(id);
    this.toast.success(`${ids.length} éléments supprimés`);
    await this.reload();
  });
}
```

```html
<!-- Modale d'élévation -->
<app-modal [open]="elevOpen()" title="Confirmation admin requise" size="sm"
           (closed)="elevOpen.set(false)">
  <p>Cette action nécessite une confirmation supplémentaire.</p>
  <div class="code-field-row">
    <app-input
      label="Code administrateur"
      [type]="elevCodeVisible() ? 'text' : 'password'"
      [(value)]="elevCode"
      [errorMessage]="elevError()"
    />
    <button mat-icon-button (click)="elevCodeVisible.update(v => !v)">
      <i [class]="elevCodeVisible() ? 'fa-solid fa-eye-slash' : 'fa-solid fa-eye'"></i>
    </button>
  </div>
  <div slot="footer">
    <button mat-button (click)="elevOpen.set(false)">Annuler</button>
    <button mat-flat-button color="warn" [disabled]="!elevCode().trim()" (click)="confirmElevation()">
      Confirmer
    </button>
  </div>
</app-modal>
```

---

## 7. Expiration de Session (Inactivité)

```typescript
// Dans le layout back-office
private inactivityTimer: ReturnType<typeof setTimeout> | null = null;
private readonly TIMEOUT_MS = 30 * 60_000; // 30 minutes

@HostListener('document:mousemove')
@HostListener('document:keydown')
@HostListener('document:click')
onActivity(): void {
  this.resetTimer();
}

private resetTimer(): void {
  if (this.inactivityTimer) clearTimeout(this.inactivityTimer);
  this.inactivityTimer = setTimeout(() => {
    this.auth.logout();
    this.router.navigate(['/back-office/login'], {
      queryParams: { reason: 'timeout' }
    });
  }, this.TIMEOUT_MS);
}

ngOnInit(): void { this.resetTimer(); }
ngOnDestroy(): void {
  if (this.inactivityTimer) clearTimeout(this.inactivityTimer);
}
```

```html
<!-- Message sur la page login si timeout -->
@if (route.snapshot.queryParams['reason'] === 'timeout') {
  <app-alert variant="warning" title="Session expirée">
    Votre session a expiré après inactivité. Veuillez vous reconnecter.
  </app-alert>
}
```

---

## 8. Journalisation des Actions

```typescript
// core/services/log.service.ts
@Injectable({ providedIn: 'root' })
export class AuditLogService {
  private readonly LOG_KEY = 'audit-log';
  private readonly MAX_ENTRIES = 500;

  record(action: string, detail: string): void {
    const entry = {
      ts:     new Date().toISOString(),
      action,
      detail,
      role:   inject(AuthService).role() ?? 'unknown',
    };

    const logs = this.load();
    logs.unshift(entry); // plus récent en premier
    if (logs.length > this.MAX_ENTRIES) logs.splice(this.MAX_ENTRIES);
    localStorage.setItem(this.LOG_KEY, JSON.stringify(logs));
  }

  load(): any[] {
    const raw = localStorage.getItem(this.LOG_KEY);
    if (!raw) return [];
    try { return JSON.parse(raw); } catch { return []; }
  }

  clear(): void {
    localStorage.removeItem(this.LOG_KEY);
  }
}
```

---

## 9. Pièges

| Symptôme | Cause | Solution |
|----------|-------|----------|
| Guard redirige même si connecté | `auth.isLoggedIn()` lit localStorage mais signal non initialisé | Initialiser le signal dans le constructeur du service depuis `localStorage.getItem(USER_KEY)` |
| Élévation ne fonctionne qu'une fois | `isElevated()` lit localStorage mais timestamp dépassé | Vérifier `Date.now() > expiry` et supprimer si expiré |
| Bouton "supprimer" masqué mais API appel possible | Seule l'UI est protégée | Vérifier le rôle dans le handler TypeScript aussi |
| Session expire pendant l'import | Timer d'inactivité se déclenche | Désactiver le timer pendant les opérations longues (set flag `operationInProgress`) |
| Modale re-auth s'ouvre en boucle | `pendingElevAction` non remis à null | `this.pendingElevAction = null` après exécution |
| Plusieurs onglets déconnectent séparément | `logout()` nettoie seulement le localStorage local | Écouter `storage` event pour synchroniser : `window.addEventListener('storage', ...)` |
