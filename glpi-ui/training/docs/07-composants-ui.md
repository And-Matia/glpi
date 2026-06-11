# 07 — Les composants UI réutilisables

L'UI repose sur **deux niveaux** (voir aussi `../ui/README.md` et `../ui/00-material-cdk.md`) :

1. **Angular Material / CDK** — utilisés **directement** dans les templates pour les widgets
   génériques (boutons, cartes, onglets, paginator, tooltip, checkbox, etc.).
2. **`shared/ui/`** — composants maison, gardés uniquement là où ils apportent une valeur réelle :
   API signal propre, look spécifique au projet.

> 🪦 **Composants supprimés** (ne pas chercher) : `app-button` → `mat-flat-button`/`mat-button`,
> `app-icon-button` → `mat-icon-button`, `app-card` → `mat-card`, `app-tabs` → `mat-tab-group`,
> `app-tooltip` → `matTooltip`, `app-checkbox` → `mat-checkbox`, `app-switch` → `mat-slide-toggle`,
> `app-chip` → `mat-chip`, `app-divider` → `mat-divider`, `app-pagination` → `mat-paginator`.

---

## 1. Catalogue Material/CDK (utiliser directement)

```ts
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatTabsModule } from '@angular/material/tabs';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { DragDropModule } from '@angular/cdk/drag-drop';
```

| Besoin | Syntaxe |
|--------|---------|
| Bouton principal | `<button mat-flat-button>` |
| Bouton texte | `<button mat-button>` |
| Bouton danger | `<button mat-flat-button color="warn">` |
| Bouton icône | `<button mat-icon-button aria-label="…">` |
| Carte | `<mat-card>` + `<mat-card-header>` + `<mat-card-content>` |
| Onglets | `<mat-tab-group>` + `<mat-tab>` |
| Paginator | `<mat-paginator>` |
| Infobulle | directive `matTooltip="texte"` |
| Case à cocher | `<mat-checkbox>` |
| Interrupteur | `<mat-slide-toggle>` |
| Chip retirable | `<mat-chip>` + `<mat-chip-set>` |
| Séparateur | `<mat-divider>` |
| Drag & drop | `cdkDrag` / `cdkDropList` |

---

## 2. Catalogue `shared/ui` (wrappers maison)

| Composant | Sélecteur | Entrées clés | Sorties / two-way |
|-----------|-----------|--------------|-------------------|
| Input | `app-input` | `label`*, `errorMessage`, `type` | `[(value)]` |
| Textarea | `app-textarea` | `label`*, `errorMessage`, `rows` | `[(value)]` |
| Select | `app-select` | `label`*, `options`* | `[(value)]` |
| SearchInput | `app-search-input` | `placeholder`, `disabled` | `[(value)]`, `(search)` |
| Badge | `app-badge` | `variant`, `size` | — |
| Spinner | `app-spinner` | `size` | — |
| EmptyState | `app-empty-state` | `icon`, `title`, `message` | — |
| Alert | `app-alert` | `variant`, `title`, `dismissible` | `(dismissed)` |
| ProgressBar | `app-progress-bar` | `value`, `max`, `variant`, `showLabel` | — |
| Skeleton | `app-skeleton` | `width`, `height`, `circle` | — |
| Table | `app-table` | `columns`*, `rows`*, `searchKeys` | — |
| Modal | `app-modal` | `open`*, `title`, `size` | `(closed)` |
| ConfirmDialog | `app-confirm-dialog` | `open`*, `title`, `message`, `danger` | `(confirmed)`, `(cancelled)` |
| Dropzone | `app-dropzone` | `accept`, `multiple`, `label`, `hint` | `(filesSelected)` |
| PageHeader | `app-page-header` | `title`*, `subtitle` | ng-content (actions) |
| Avatar | `app-avatar` | `name`, `src`, `size` | — |
| Breadcrumb | `app-breadcrumb` | `items`* | — |
| StatCard | `app-stat-card` | `label`, `value`, `icon`, `variant` | — |
| Toast | `app-toast` | — (piloté par `ToastService`) | — |

`*` = requis (`input.required`). `[(value)]` = `model<T>()` two-way.

---

## 3. Anatomie d'un composant `shared/ui` (exemple : `badge.component.ts`)

```ts
export type BadgeVariant = 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'neutral';

@Component({
  selector: 'app-badge',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './badge.component.html', styleUrl: './badge.component.css',
})
export class BadgeComponent {
  variant = input<BadgeVariant>('neutral');
  size    = input<'sm' | 'md'>('md');
  // Contenu projeté via <ng-content> dans le template
}
```

Tous les composants `shared/ui` suivent ce schéma :
- `input<T>()` pour les entrées simples (sens parent → enfant).
- `input.required<T>()` pour les entrées obligatoires.
- `output<T>()` pour les événements (sens enfant → parent).
- `model<T>()` pour les liaisons bidirectionnelles (`[(prop)]`).
- `ChangeDetectionStrategy.OnPush` systématique.
- `inject()` pour les dépendances — jamais le constructeur.

---

## 4. Utilisation côté page

```html
<app-page-header title="Tickets" subtitle="Gestion GLPI">
  <button mat-flat-button (click)="create()">Nouveau</button>
</app-page-header>

<mat-card>
  <mat-card-header><mat-card-title>Filtres</mat-card-title></mat-card-header>
  <mat-card-content>
    <app-input label="Titre *" [(value)]="titre" [errorMessage]="titreError()" />
    <app-select label="Type" [options]="typeOptions" [(value)]="type" />
    <app-search-input placeholder="Rechercher…" [(value)]="q" />
  </mat-card-content>
</mat-card>

@if (step.status === 'validated') { <app-badge variant="success">Valide</app-badge> }
```

---

## 5. La table (`app-table`)

```ts
readonly columns: TableColumn[] = [
  { key: 'ref_ticket', label: 'Réf.',  sortable: true, width: '80px'  },
  { key: 'titre',      label: 'Titre', sortable: true                 },
  { key: 'status',     label: 'Statut',                width: '160px' },
  { key: 'actions',    label: '',                       width: '80px'  },
];
```
```html
<app-table [columns]="columns" [rows]="rows()">
  <ng-template appCell="status" let-value="value">
    <app-badge [variant]="statusVariant(value)" size="sm">{{ value }}</app-badge>
  </ng-template>
  <ng-template appCell="actions" let-row>
    <button mat-icon-button aria-label="Voir" [routerLink]="[row.id]">
      <i class="fa-solid fa-eye"></i>
    </button>
  </ng-template>
</app-table>
```

Voir `../ui/05-table.md` pour le détail complet.

---

## 6. Dialogues : Modal & ConfirmDialog

```html
<app-confirm-dialog
  [open]="confirmOpen()"
  title="Réinitialiser les données"
  message="Action irréversible. Continuer ?"
  confirmLabel="Oui, tout supprimer"
  [danger]="true"
  (confirmed)="onConfirmed()"
  (cancelled)="confirmOpen.set(false)" />
```
Pattern : un `signal<boolean>` pilote `[open]`, et on réagit aux sorties.

---

## 7. Projection de contenu (`<ng-content>`)

`PageHeader` projette des actions :
```html
<app-page-header [title]="'Ticket #' + t.ref_ticket" [subtitle]="t.titre">
  <button mat-button (click)="goBack()">← Retour</button>
</app-page-header>
```
`app-modal` utilise un **slot nommé** pour le pied :
```html
<app-modal [open]="open()" title="Titre" (closed)="open.set(false)">
  <!-- corps -->
  <div slot="footer">
    <button mat-button (click)="open.set(false)">Annuler</button>
    <button mat-flat-button (click)="save()">Enregistrer</button>
  </div>
</app-modal>
```

---

## 8. Icônes FontAwesome

Chargé via CDN dans `index.html`. Usage : une balise `<i>` avec les classes :
```html
<i class="fa-solid fa-circle-check"></i>
<i class="fa-regular fa-circle"></i>
<i [class]="stepIcons[$index]" class="step-icon"></i>   <!-- classe dynamique -->
```
`fa-solid` / `fa-regular` = style ; `fa-xxx` = icône. Sur `mat-icon-button`, l'icône est le contenu du bouton :
```html
<button mat-icon-button aria-label="Modifier" (click)="edit(row)">
  <i class="fa-solid fa-pen"></i>
</button>
```

---

## 9. Quand créer un nouveau composant `shared/ui` ?

- Si tu réécris **3 fois** le même bout d'UI → fais-en un composant.
- Il doit rester **générique** (pas de logique métier, pas d'appel service).
- **N'enveloppe pas** un widget Material existant — utilise-le directement.
- Entrées via `input()`, sorties via `output()`, formulaire via `model()`, `OnPush`.

---

## 10. Erreurs fréquentes

| ❌ | ✅ |
|----|----|
| Écrire `<app-button>` / `(clicked)` | `<button mat-flat-button>` / `(click)` natif |
| Écrire `<app-card>` / `<app-tabs>` / `<app-divider>` | `<mat-card>` / `<mat-tab-group>` / `<mat-divider>` |
| Écrire `<app-pagination>` | `<mat-paginator>` |
| Écrire `<app-tooltip>` | directive `matTooltip="…"` |
| HTML brut `<input>` pour une saisie | `app-input [(value)]` |
| Mettre un appel HTTP dans un composant `ui` | non : il reste présentationnel |
| Oublier d'ajouter le module/composant aux `imports` | l'ajouter (erreur de template sinon) |
| Passer des entités brutes à `app-table` | préparer des `rows` affichables d'abord |
| Réinventer un badge de statut | `app-badge variant="…"` |

➡️ Ensuite : **`08-ui-ux-styles.md`**.
