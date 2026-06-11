# 03 — Feedback : `Spinner`, `Badge`, `Alert`, `EmptyState`, `Toast`, `ProgressBar`, `Skeleton` + `matTooltip` / `mat-chip`

Tout ce qui informe l'utilisateur : chargement, statut, messages, vide, progression.

> 🪦 `app-chip` et `app-tooltip` **n'existent plus**. Remplacés par `mat-chip`/`mat-chip-set` et
> la directive `matTooltip` (Angular Material direct).

---

## `app-spinner` — chargement
| Membre | Type | Défaut |
|--------|------|--------|
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` |

```html
@if (loading()) {
  <div class="loader"><app-spinner size="lg" /></div>
} @else {
  <!-- contenu -->
}
```

---

## `app-badge` — étiquette de statut (texte projeté)
| Membre | Type | Défaut |
|--------|------|--------|
| `variant` | `'primary' \| 'success' \| 'warning' \| 'danger' \| 'info' \| 'neutral'` | `'neutral'` |
| `size` | `'sm' \| 'md'` | `'md'` |

```html
<app-badge variant="success" size="sm">En production</app-badge>
```

### Recette : mapper une donnée → variante
```ts
import { BadgeVariant } from '@app/shared/ui/badge/badge.component';

statusVariant(status: string): BadgeVariant {
  switch (status) {
    case 'En production': return 'success';
    case 'En stock':      return 'info';
    case 'Maintenance':   return 'warning';
    case 'En panne':      return 'danger';
    default:              return 'neutral';
  }
}
```
```html
<app-badge [variant]="statusVariant(value)" size="sm">{{ value }}</app-badge>
```

---

## Chip / étiquette retirable : `mat-chip` (Material direct)

> 🪦 `app-chip` est supprimé. Utilise `mat-chip` / `mat-chip-set` :

```ts
import { MatChipsModule } from '@angular/material/chips';
```
```ts
readonly selected = signal<Item[]>([]);
```
```html
<mat-chip-set>
  @for (item of selected(); track item.id) {
    <mat-chip (removed)="unselect(item.id)">
      {{ item.name }}
      <button matChipRemove aria-label="Retirer {{ item.name }}">
        <i class="fa-solid fa-xmark"></i>
      </button>
    </mat-chip>
  }
</mat-chip-set>
```

> **Badge vs Chip** : le Badge (`app-badge`) est purement informatif. Le Chip (`mat-chip`)
> représente une sélection que l'utilisateur peut retirer — il a un bouton `matChipRemove`.

---

## Infobulle : `matTooltip` (Material direct)

> 🪦 `app-tooltip` est supprimé. Utilise la directive `matTooltip` :

```ts
import { MatTooltipModule } from '@angular/material/tooltip';
```
```html
<!-- Sur n'importe quel élément -->
<button mat-icon-button matTooltip="Réinitialiser les données GLPI" aria-label="Reset"
        (click)="reset()">
  <i class="fa-solid fa-rotate-left"></i>
</button>

<!-- Position personnalisée -->
<span matTooltip="Identifiant interne" matTooltipPosition="right">{{ item().id }}</span>
```

Positions disponibles : `above` (défaut), `below`, `left`, `right`.

---

## `app-alert` — message en bandeau (dans la page)
| Membre | Type | Défaut |
|--------|------|--------|
| `variant` | `'success' \| 'danger' \| 'warning' \| 'info'` | `'info'` |
| `title` | `string` | `''` |
| `icon` | `string` | `''` (icône auto selon la variante si vide) |
| `dismissible` | `boolean` | `false` |
| `dismissed` | `output<void>()` | — |
| *(contenu)* | `ng-content` | le corps du message |

```html
@if (error()) {
  <app-alert variant="danger" title="Échec de l'import" [dismissible]="true" (dismissed)="error.set('')">
    {{ error() }}
  </app-alert>
}
```

> **Alert vs Toast** : l'Alert reste **dans la page** (erreur de formulaire, résumé). Le Toast est
> une notification **éphémère** déclenchée par une action (succès de sauvegarde).

---

## `app-empty-state` — état vide
| Membre | Type | Défaut |
|--------|------|--------|
| `icon` | `string` | `'fa-solid fa-inbox'` |
| `title` | `string` | `'Aucun résultat'` |
| `message` | `string` | `''` |

```html
@if (!rows().length) {
  <app-empty-state icon="fa-solid fa-desktop" title="Aucun élément"
    message="Importez un CSV pour commencer." />
}
```
> Le composant **Table** a déjà un état vide intégré (`emptyIcon`/`emptyLabel`). N'ajoute
> `app-empty-state` que **hors** tableau.

---

## Toast — notifications éphémères (piloté par service)
Le toast **n'est pas** posé manuellement dans chaque page. `<app-toast />` est monté **une fois**
dans `app.html`. Tu déclenches via `ToastService`.

```ts
import { ToastService } from '@app/core/services/toast.service';
private readonly toast = inject(ToastService);

this.toast.success('Ticket créé avec succès !');
this.toast.error('Erreur lors de la création.');
this.toast.warning('Champs obligatoires manquants.');
this.toast.info('Import en cours…');
```

> ⚠️ Toast = **résultat d'une action**. Pour une erreur persistante de chargement, préfère
> `app-alert` ou un message d'erreur inline dans la page.

---

## `app-progress-bar` — progression
| Membre | Type | Défaut |
|--------|------|--------|
| `value` | `number` | `0` |
| `max` | `number` | `100` |
| `variant` | `'primary' \| 'success' \| 'warning' \| 'danger' \| 'info'` | `'primary'` |
| `showLabel` | `boolean` | `false` |

```html
<app-progress-bar [value]="done()" [max]="total()" variant="success" [showLabel]="true" />
```
Idéal pour un import : `value = lignes traitées`, `max = total`.

---

## `app-skeleton` — placeholder de chargement
| Membre | Type | Défaut |
|--------|------|--------|
| `width` | `string` | `'100%'` |
| `height` | `string` | `'1rem'` |
| `circle` | `boolean` | `false` |

```html
@if (loading()) {
  @for (_ of [1,2,3,4,5]; track $index) {
    <app-skeleton height="2.5rem" />
  }
} @else { <!-- vraies lignes --> }
```
> Alternative au `Spinner` : le squelette préserve la mise en page et paraît plus rapide.

---

## Imports
```ts
import { SpinnerComponent } from '@app/shared/ui/spinner/spinner.component';
import { BadgeComponent } from '@app/shared/ui/badge/badge.component';
import { AlertComponent } from '@app/shared/ui/alert/alert.component';
import { EmptyStateComponent } from '@app/shared/ui/empty-state/empty-state.component';
import { ProgressBarComponent } from '@app/shared/ui/progress-bar/progress-bar.component';
import { SkeletonComponent } from '@app/shared/ui/skeleton/skeleton.component';
import { MatChipsModule } from '@angular/material/chips';          // chip direct
import { MatTooltipModule } from '@angular/material/tooltip';      // tooltip direct
// Toast : pas d'import composant dans les pages — inject ToastService.
```

## Pièges récurrents
- Reposer `<app-toast />` dans une page : il est déjà global dans `app.html`.
- Utiliser un Badge là où il faut un Chip (besoin de retirer un élément) et vice-versa.
- Mettre une Alert pour un succès éphémère (préfère un Toast) ou un Toast pour une erreur
  persistante (préfère une Alert).
- Sur `mat-chip` avec suppression, oublier `matChipRemove` sur le bouton intérieur → le chip
  ne se retire pas.
- Sur `matTooltip` : l'infobulle n'apparaît pas si l'élément est `disabled` (comportement
  Material par défaut).
