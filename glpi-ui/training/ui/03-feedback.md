# 03 — Feedback : `Spinner`, `Badge`, `Chip`, `Alert`, `EmptyState`, `Toast`, `Tooltip`, `ProgressBar`, `Skeleton`

Tout ce qui informe l'utilisateur : chargement, statut, messages, vide, progression.

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

## `app-chip` — étiquette **supprimable** (sélections, filtres actifs)
| Membre | Type | Défaut |
|--------|------|--------|
| `variant` | `'neutral' \| 'primary' \| 'success' \| 'warning' \| 'danger' \| 'info'` | `'neutral'` |
| `icon` | `string` | `''` |
| `removable` | `boolean` | `false` |
| `removed` | `output<void>()` | — |

```html
@for (item of selected(); track item.id) {
  <app-chip icon="fa-solid fa-desktop" [removable]="true" (removed)="unselect(item.id)">
    {{ item.name }}
  </app-chip>
}
```

> Différence **Badge vs Chip** : le Badge est purement informatif ; le Chip représente une
> sélection que l'utilisateur peut retirer (`removable` + `removed`).

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
> `app-alert` ou un `<p class="error">` dans la page.

---

## `app-tooltip` — infobulle (enveloppe un élément)
| Membre | Type | Défaut |
|--------|------|--------|
| `text` | `string` (**requis**) | — |
| `position` | `'top' \| 'bottom' \| 'left' \| 'right'` | `'top'` |
| *(contenu)* | `ng-content` | l'élément survolé |

```html
<app-tooltip text="Réinitialise toutes les données GLPI" position="bottom">
  <app-icon-button icon="fa-solid fa-rotate-left" ariaLabel="Reset" (clicked)="reset()" />
</app-tooltip>
```

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
import { ChipComponent } from '@app/shared/ui/chip/chip.component';
import { AlertComponent } from '@app/shared/ui/alert/alert.component';
import { EmptyStateComponent } from '@app/shared/ui/empty-state/empty-state.component';
import { TooltipComponent } from '@app/shared/ui/tooltip/tooltip.component';
import { ProgressBarComponent } from '@app/shared/ui/progress-bar/progress-bar.component';
import { SkeletonComponent } from '@app/shared/ui/skeleton/skeleton.component';
// Toast : pas d'import composant dans les pages — inject ToastService.
```

## Pièges récurrents
- Reposer `<app-toast />` dans une page : il est déjà global dans `app.html`.
- Utiliser un Badge là où il faut un Chip (besoin de retirer un élément) et vice-versa.
- Mettre une Alert pour un succès éphémère (préfère un Toast) ou un Toast pour une erreur
  persistante (préfère une Alert).
