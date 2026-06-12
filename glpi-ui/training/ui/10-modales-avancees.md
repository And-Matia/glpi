# 10 — Modales Avancées & Overlays

> app-modal, app-confirm-dialog, modales empilées, drawer coulissant, données depuis une modale, focus trap, scroll lock.

---

## Cheat-Sheet : app-modal

```
Selector  : <app-modal>
Inputs    : [open]* boolean | [title] string | [size] 'sm'|'md'|'lg'|'xl'
Outputs   : (closed) — l'utilisateur ferme (clic backdrop ou Échap)
Projection: contenu dans <ng-content> | footer dans <div slot="footer">
Focus trap: automatique (CDK A11yModule)
Scroll lock: automatique (OverlayScrollStrategy.block())
```

```html
<app-modal [open]="modalOpen()" title="Mon titre" size="lg" (closed)="modalOpen.set(false)">
  <!-- Corps de la modale -->
  <p>Contenu ici</p>

  <!-- Footer (boutons) -->
  <div slot="footer">
    <button mat-button (click)="modalOpen.set(false)">Annuler</button>
    <button mat-flat-button (click)="save()">Enregistrer</button>
  </div>
</app-modal>
```

**IMPORTANT** : la modale ne se ferme pas automatiquement. Toujours gérer `(closed)` pour mettre `open` à `false`.

---

## Cheat-Sheet : app-confirm-dialog

```
Selector : <app-confirm-dialog>
Inputs   : [open]* | [title] | [message] | [confirmLabel] | [cancelLabel] | [danger] boolean
Outputs  : (confirmed) | (cancelled)
```

```html
<app-confirm-dialog
  [open]="confirmOpen()"
  title="Supprimer l'élément"
  message="Cette action est irréversible."
  confirmLabel="Supprimer"
  [danger]="true"
  (confirmed)="onDeleteConfirmed()"
  (cancelled)="confirmOpen.set(false)"
/>
```

---

## 1. Modale avec Formulaire — Récupérer les Données

### Pattern création en modal

```typescript
readonly modalOpen   = signal(false);
readonly savingModal = signal(false);

// Champs du formulaire dans la modale
readonly formName    = signal('');
readonly formStatus  = signal<number | null>(null);
readonly formError   = signal('');

openCreate(): void {
  this.formName.set('');       // Réinitialiser
  this.formStatus.set(null);
  this.formError.set('');
  this.modalOpen.set(true);
}

async saveModal(): Promise<void> {
  // Validation
  if (!this.formName().trim()) {
    this.formError.set('Le nom est requis');
    return;
  }
  this.savingModal.set(true);
  try {
    await this.service.create({ name: this.formName(), status: this.formStatus() });
    this.toast.success('Créé avec succès');
    this.modalOpen.set(false);
    await this.loadData(); // Rafraîchir la liste
  } catch {
    this.toast.error('Erreur lors de la création');
  } finally {
    this.savingModal.set(false);
  }
}
```

```html
<button mat-flat-button (click)="openCreate()">Nouveau</button>

<app-modal [open]="modalOpen()" title="Créer un élément" (closed)="modalOpen.set(false)">
  <div class="form-stack">
    <app-input label="Nom *" [(value)]="formName" [errorMessage]="formError()" />
    <app-select label="Statut" [options]="statusOptions" [(value)]="formStatus" />
  </div>

  <div slot="footer">
    <button mat-button (click)="modalOpen.set(false)">Annuler</button>
    <button mat-flat-button
            [disabled]="savingModal()"
            (click)="saveModal()">
      {{ savingModal() ? 'Enregistrement…' : 'Créer' }}
    </button>
  </div>
</app-modal>
```

### Pattern édition en modal (pré-remplissage)

```typescript
readonly editingId = signal<number | null>(null);

openEdit(item: MyItem): void {
  this.editingId.set(item.id);
  this.formName.set(item.name);      // Pré-remplir
  this.formStatus.set(item.status);
  this.formError.set('');
  this.modalOpen.set(true);
}

async saveModal(): Promise<void> {
  if (!this.formName().trim()) { this.formError.set('Requis'); return; }
  this.savingModal.set(true);
  try {
    if (this.editingId() !== null) {
      await this.service.update(this.editingId()!, {
        name: this.formName(),
        status: this.formStatus(),
      });
    } else {
      await this.service.create({ name: this.formName(), status: this.formStatus() });
    }
    this.toast.success('Enregistré');
    this.modalOpen.set(false);
    await this.loadData();
  } catch {
    this.toast.error('Erreur');
  } finally {
    this.savingModal.set(false);
  }
}
```

```html
<!-- Titre dynamique selon mode -->
<app-modal [open]="modalOpen()"
           [title]="editingId() ? 'Modifier' : 'Créer'"
           (closed)="modalOpen.set(false)">
```

---

## 2. Modale Conditionnelle (selon transition)

Selon l'action déclenchée, ouvrir des modales différentes.

```typescript
// Exemple : passage Résolu exige solution, En attente exige motif+date
readonly solutionOpen = signal(false);
readonly waitingOpen  = signal(false);
readonly solutionText = signal('');
readonly waitingReason = signal('');
readonly waitingDate   = signal('');

changeStatus(ticket: Ticket, newStatus: number): void {
  if (newStatus === STATUS_RESOLVED) {
    this.pendingTicket.set(ticket);
    this.solutionText.set('');
    this.solutionOpen.set(true);
  } else if (newStatus === STATUS_WAITING) {
    this.pendingTicket.set(ticket);
    this.waitingReason.set('');
    this.waitingDate.set('');
    this.waitingOpen.set(true);
  } else {
    this.applyStatusChange(ticket, newStatus);
  }
}

async confirmSolution(): Promise<void> {
  if (!this.solutionText().trim()) return;
  await this.ticketService.resolve(this.pendingTicket()!.id, this.solutionText());
  this.solutionOpen.set(false);
  await this.reload();
}

async confirmWaiting(): Promise<void> {
  if (!this.waitingReason().trim() || !this.waitingDate()) return;
  await this.ticketService.setWaiting(
    this.pendingTicket()!.id,
    this.waitingReason(),
    this.waitingDate()
  );
  this.waitingOpen.set(false);
  await this.reload();
}
```

```html
<!-- Modale solution -->
<app-modal [open]="solutionOpen()" title="Solution requise" (closed)="solutionOpen.set(false)">
  <app-textarea label="Solution *" [(value)]="solutionText" [rows]="4" />
  <div slot="footer">
    <button mat-button (click)="solutionOpen.set(false)">Annuler</button>
    <button mat-flat-button [disabled]="!solutionText().trim()" (click)="confirmSolution()">
      Résoudre
    </button>
  </div>
</app-modal>

<!-- Modale mise en attente -->
<app-modal [open]="waitingOpen()" title="Mise en attente" (closed)="waitingOpen.set(false)">
  <div class="form-stack">
    <app-textarea label="Motif *" [(value)]="waitingReason" [rows]="3" />
    <app-input label="Date de relance *" type="date" [(value)]="waitingDate" />
  </div>
  <div slot="footer">
    <button mat-button (click)="waitingOpen.set(false)">Annuler</button>
    <button mat-flat-button
            [disabled]="!waitingReason().trim() || !waitingDate()"
            (click)="confirmWaiting()">
      Confirmer
    </button>
  </div>
</app-modal>
```

---

## 3. Modales Empilées (Modale dans Modale)

Une modale peut en ouvrir une seconde. Le z-index est géré par CDK Overlay.

```typescript
// Signaux séparés pour chaque modale
readonly modal1Open = signal(false);
readonly modal2Open = signal(false); // ouverte depuis modal1

// Fermer modal2 revient à modal1 (qui est toujours ouverte)
closeModal2(): void {
  this.modal2Open.set(false);
  // modal1Open reste true → retour propre à modal1
}

closeAll(): void {
  this.modal2Open.set(false);
  this.modal1Open.set(false);
}
```

```html
<!-- Modale 1 -->
<app-modal [open]="modal1Open()" title="Sélectionner un élément" size="lg"
           (closed)="modal1Open.set(false)">
  <p>Contenu de modal 1</p>
  <button mat-stroked-button (click)="modal2Open.set(true)">
    Créer un nouvel élément
  </button>

  <div slot="footer">
    <button mat-button (click)="modal1Open.set(false)">Fermer</button>
  </div>
</app-modal>

<!-- Modale 2 (sur modale 1) -->
<app-modal [open]="modal2Open()" title="Créer" size="sm"
           (closed)="closeModal2()">
  <app-input label="Nom" [(value)]="newItemName" />
  <div slot="footer">
    <button mat-button (click)="closeModal2()">Retour</button>
    <button mat-flat-button (click)="createAndSelect()">Créer</button>
  </div>
</app-modal>
```

**Note** : app-modal utilise CDK Overlay qui gère automatiquement le z-index cumulatif. Le scroll de l'arrière-plan est bloqué par la première modale déjà.

---

## 4. Drawer / Panneau Coulissant (mat-sidenav)

Pour consulter/éditer sans quitter la liste.

```typescript
import { MatSidenavModule } from '@angular/material/sidenav';

@Component({
  imports: [MatSidenavModule, /* … */],
})
export class ItemListWithDrawerComponent {
  readonly drawerOpen   = signal(false);
  readonly selectedItem = signal<MyItem | null>(null);

  openDrawer(item: MyItem): void {
    this.selectedItem.set(item);
    this.drawerOpen.set(true);
  }

  closeDrawer(): void {
    this.drawerOpen.set(false);
    // Optionnel : délai avant de vider selectedItem (animation)
    setTimeout(() => this.selectedItem.set(null), 300);
  }
}
```

```html
<mat-sidenav-container class="drawer-container">
  <!-- Contenu principal (liste) -->
  <mat-sidenav-content>
    <app-table [columns]="columns" [rows]="rows()">
      <ng-template appCell="actions" let-row>
        <button mat-icon-button (click)="openDrawer(row)" aria-label="Voir détail">
          <i class="fa-solid fa-eye"></i>
        </button>
      </ng-template>
    </app-table>
  </mat-sidenav-content>

  <!-- Panneau latéral droit -->
  <mat-sidenav
    position="end"
    [opened]="drawerOpen()"
    (closedStart)="drawerOpen.set(false)"
    class="drawer-panel"
  >
    @if (selectedItem()) {
      <div class="drawer-header">
        <h3>{{ selectedItem()!.name }}</h3>
        <div class="drawer-header__actions">
          <button mat-icon-button [routerLink]="['/items', selectedItem()!.id]"
                  aria-label="Ouvrir en pleine page" matTooltip="Pleine page">
            <i class="fa-solid fa-arrow-up-right-from-square"></i>
          </button>
          <button mat-icon-button (click)="closeDrawer()" aria-label="Fermer">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>
      </div>

      <div class="drawer-body">
        <!-- Contenu de la fiche -->
        <dl class="detail-list">
          <dt>Statut</dt>
          <dd><app-badge [variant]="statusVariant(selectedItem()!.status)">{{ selectedItem()!.status }}</app-badge></dd>
          <dt>Lieu</dt>
          <dd>{{ selectedItem()!.location || '—' }}</dd>
        </dl>
      </div>
    }
  </mat-sidenav>
</mat-sidenav-container>
```

```css
.drawer-container { height: calc(100vh - 64px); }

.drawer-panel {
  width: 420px;
  display: flex;
  flex-direction: column;
  border-left: 1px solid var(--color-border);
}

.drawer-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-4);
  border-bottom: 1px solid var(--color-border);
}

.drawer-body {
  flex: 1;
  overflow-y: auto;
  padding: var(--spacing-4);
}
```

---

## 5. Modale de Code Unique (Re-auth à la Volée)

Pour les actions sensibles : demander le code sans quitter la page.

```typescript
readonly authCodeOpen    = signal(false);
readonly authCodeValue   = signal('');
readonly authCodeVisible = signal(false);
readonly authCodeError   = signal('');
private pendingAction: (() => Promise<void>) | null = null;

// Appeler avant toute action sensible
requireCode(action: () => Promise<void>): void {
  this.pendingAction = action;
  this.authCodeValue.set('');
  this.authCodeError.set('');
  this.authCodeOpen.set(true);
}

async confirmCode(): Promise<void> {
  const code = this.authCodeValue().trim();
  if (!code) return;
  if (code !== environment.backOfficePassword) {
    this.authCodeError.set('Code incorrect');
    return;
  }
  this.authCodeOpen.set(false);
  if (this.pendingAction) {
    await this.pendingAction();
    this.pendingAction = null;
  }
}

// Exemple d'utilisation :
deleteItem(id: number): void {
  this.requireCode(async () => {
    await this.service.delete(id);
    this.toast.success('Supprimé');
    await this.reload();
  });
}
```

```html
<!-- Bouton qui déclenche la demande de code -->
<button mat-flat-button color="warn" (click)="deleteItem(item.id)">
  Supprimer
</button>

<!-- Modale code unique -->
<app-modal [open]="authCodeOpen()" title="Confirmer l'action" size="sm"
           (closed)="authCodeOpen.set(false)">
  <p>Saisissez le code d'accès pour continuer.</p>
  <div class="code-field">
    <app-input
      label="Code"
      [type]="authCodeVisible() ? 'text' : 'password'"
      [(value)]="authCodeValue"
      [errorMessage]="authCodeError()"
    />
    <button mat-icon-button (click)="authCodeVisible.update(v => !v)"
            [attr.aria-label]="authCodeVisible() ? 'Masquer' : 'Afficher'">
      <i [class]="authCodeVisible() ? 'fa-solid fa-eye-slash' : 'fa-solid fa-eye'"></i>
    </button>
  </div>

  <div slot="footer">
    <button mat-button (click)="authCodeOpen.set(false)">Annuler</button>
    <button mat-flat-button [disabled]="!authCodeValue().trim()" (click)="confirmCode()">
      Confirmer
    </button>
  </div>
</app-modal>
```

---

## 6. Modale de Confirmation de Suppression avec Vérification

```typescript
readonly deleteId     = signal<number | null>(null);
readonly deleteOpen   = signal(false);
readonly deleteBlocked = signal(false);
readonly linkedTickets = signal<Ticket[]>([]);

async openDelete(id: number): Promise<void> {
  this.deleteId.set(id);
  // Vérifier les dépendances avant d'ouvrir
  const linked = await this.ticketService.getByItemId(id);
  this.linkedTickets.set(linked);
  this.deleteBlocked.set(linked.some(t => t.status !== STATUS_RESOLVED));
  this.deleteOpen.set(true);
}

async confirmDelete(): Promise<void> {
  try {
    await this.itemService.delete(this.deleteId()!);
    this.toast.success('Élément supprimé');
    this.deleteOpen.set(false);
    await this.reload();
  } catch {
    this.toast.error('Erreur lors de la suppression');
  }
}
```

```html
<app-modal [open]="deleteOpen()" title="Supprimer l'élément" (closed)="deleteOpen.set(false)">
  @if (deleteBlocked()) {
    <app-alert variant="danger" title="Suppression impossible">
      Cet élément est lié à {{ linkedTickets().length }} ticket(s) ouvert(s).
      Veuillez d'abord résoudre ces tickets.
    </app-alert>
  } @else {
    <p>Confirmer la suppression ? Cette action est irréversible.</p>
    @if (linkedTickets().length > 0) {
      <p class="text-warning">
        Attention : {{ linkedTickets().length }} ticket(s) seront détachés.
      </p>
    }
  }

  <div slot="footer">
    <button mat-button (click)="deleteOpen.set(false)">Annuler</button>
    @if (!deleteBlocked()) {
      <button mat-flat-button color="warn" (click)="confirmDelete()">Supprimer</button>
    }
  </div>
</app-modal>
```

---

## 7. Pattern Complet : Retourner une Valeur Depuis une Modale

Pour les cas où une modale sert à « choisir » quelque chose (ex: choisir un technicien).

```typescript
// Dans le composant parent
readonly pickerOpen       = signal(false);
readonly pickerSelected   = signal<Technicien | null>(null);
private onPickerConfirm: ((tech: Technicien) => void) | null = null;

// Ouvrir le picker et définir le callback
selectTechnicien(onSelect: (t: Technicien) => void): void {
  this.pickerSelected.set(null);
  this.onPickerConfirm = onSelect;
  this.pickerOpen.set(true);
}

confirmPicker(): void {
  if (!this.pickerSelected()) return;
  this.onPickerConfirm?.(this.pickerSelected()!);
  this.pickerOpen.set(false);
}

// Usage :
assignTicket(ticketId: number): void {
  this.selectTechnicien(tech => {
    this.ticketService.assign(ticketId, tech.id);
    this.toast.success(`Assigné à ${tech.name}`);
  });
}
```

```html
<!-- Appel depuis la liste (ex: bouton sur chaque ligne) -->
<button mat-icon-button (click)="assignTicket(row.id)">
  <i class="fa-solid fa-user-plus"></i>
</button>

<!-- Modale picker -->
<app-modal [open]="pickerOpen()" title="Assigner un technicien" (closed)="pickerOpen.set(false)">
  <div class="tech-list">
    @for (tech of technicians(); track tech.id) {
      <div class="tech-item"
           [class.selected]="pickerSelected()?.id === tech.id"
           (click)="pickerSelected.set(tech)">
        <app-avatar [name]="tech.name" size="sm" />
        <span>{{ tech.name }}</span>
      </div>
    }
  </div>

  <div slot="footer">
    <button mat-button (click)="pickerOpen.set(false)">Annuler</button>
    <button mat-flat-button [disabled]="!pickerSelected()" (click)="confirmPicker()">
      Assigner
    </button>
  </div>
</app-modal>
```

---

## 8. Pièges

| Symptôme | Cause | Solution |
|----------|-------|----------|
| Modale ne se ferme pas | `(closed)` non géré | Ajouter `(closed)="modalOpen.set(false)"` |
| Formulaire garde les anciennes valeurs | Signaux non réinitialisés à l'ouverture | Appeler `formField.set('')` dans `openCreate()` |
| Bouton confirm toujours actif après fermeture | État `saving` non remis à `false` | Utiliser `finally { this.saving.set(false) }` |
| Drawer ne se ferme pas au clic extérieur | `mode` sidenav manquant | Utiliser `mode="over"` (par défaut CDK, ferme au clic backdrop) |
| Scroll de la page continue derrière la modale | app-modal non utilisé (implémentation custom) | Utiliser `app-modal` qui intègre `scrollStrategy.block()` |
| Focus ne revient pas à l'élément déclencheur | app-modal gère le CDK FocusTrap mais pas le retour | Stocker `document.activeElement` avant ouverture, restaurer dans `(closed)` |
| `z-index` incorrect pour modales empilées | Hardcoder z-index | Laisser CDK Overlay gérer (incrémente automatiquement) |
| Modale s'ouvre mais vide | `@if (condition)` autour du contenu pas évalué | S'assurer que le signal de données est set avant `modalOpen.set(true)` |
