# 04 — Structure : `PageHeader`, `Avatar`, `Breadcrumb`, `StatCard` + `mat-card` / `mat-tab-group` / `mat-divider`

Les composants qui **organisent** une page : en-tête, conteneurs, séparateurs, navigation interne,
indicateurs.

> 🪦 `app-card`, `app-divider` et `app-tabs` **n'existent plus**. Remplacés par Material direct :
> `mat-card`, `mat-divider`, `mat-tab-group`.

---

## `app-page-header` — en-tête de page (titre + actions)
| Membre | Type | Défaut |
|--------|------|--------|
| `title` | `string` (**requis**) | — |
| `subtitle` | `string` | `''` |
| *(contenu)* | `ng-content` | les **actions** à droite (boutons) |

```html
<app-page-header title="Tickets" subtitle="Liste de tous les tickets GLPI">
  <button mat-flat-button (click)="create()">Nouveau</button>
</app-page-header>
```
> Toute page de feature commence par un `app-page-header`. Les boutons projetés se placent
> automatiquement à droite.

---

## Carte : `mat-card` (Material direct)

> 🪦 `app-card` est supprimé. Utilise `mat-card` :

```ts
import { MatCardModule } from '@angular/material/card';
```
```html
<!-- Carte standard -->
<mat-card>
  <mat-card-header>
    <mat-card-title>Informations</mat-card-title>
  </mat-card-header>
  <mat-card-content>
    <p>Contenu de la carte…</p>
  </mat-card-content>
</mat-card>

<!-- Carte avec actions en bas -->
<mat-card>
  <mat-card-header>
    <mat-card-title>Détails</mat-card-title>
  </mat-card-header>
  <mat-card-content>
    <dl class="fiche">
      <dt>Statut</dt> <dd>{{ item().status }}</dd>
    </dl>
  </mat-card-content>
  <mat-card-actions align="end">
    <button mat-button (click)="goBack()">Retour</button>
    <button mat-flat-button (click)="save()">Enregistrer</button>
  </mat-card-actions>
</mat-card>
```

> `mat-card-actions` est optionnel. Pour les actions en haut (en-tête), utilise une ligne `flex`
> à l'intérieur de `mat-card-header` avec `justify-content: space-between`.

---

## Séparateur : `mat-divider` (Material direct)

> 🪦 `app-divider` est supprimé. Utilise `mat-divider` :

```ts
import { MatDividerModule } from '@angular/material/divider';
```
```html
<!-- Séparateur horizontal -->
<mat-divider />

<!-- Avec espacement parent (ex. entre deux sections) -->
<section>…</section>
<mat-divider />
<section>…</section>
```

> `mat-divider` est un trait horizontal pur. L'espacement autour vient du **parent**
> (`gap` en flex/grid), pas de marges sur le divider lui-même.

---

## Onglets : `mat-tab-group` (Material direct)

> 🪦 `app-tabs` est supprimé. Utilise `mat-tab-group` :

```ts
import { MatTabsModule } from '@angular/material/tabs';
```
```html
<mat-tab-group>
  <mat-tab label="Informations">
    <!-- contenu onglet 1 -->
  </mat-tab>
  <mat-tab label="Éléments liés">
    <!-- contenu onglet 2 -->
  </mat-tab>
  <mat-tab label="Coûts">
    <!-- contenu onglet 3 -->
  </mat-tab>
</mat-tab-group>
```

> Avec `mat-tab-group`, le **contenu est dans le template** (pas de `@switch` externe).
> Si tu as besoin de savoir quel onglet est actif, utilise `(selectedIndexChange)` ou
> `(selectedTabChange)` sur `mat-tab-group`.

---

## `app-avatar` — pastille d'initiales / image
| Membre | Type | Défaut |
|--------|------|--------|
| `name` | `string` | `''` (sert à calculer les initiales) |
| `src` | `string` | `''` (si fourni : affiche l'image) |
| `size` | `'sm' \| 'md' \| 'lg' \| 'xl'` | `'md'` |

```html
<app-avatar [name]="row.user" size="sm" />
```
> Le composant coerce l'entrée en chaîne ; il affiche `?` si `name` est vide. Sans `src`, il
> affiche les initiales (1 mot → 1 lettre, 2+ mots → 1re + dernière).

---

## `app-breadcrumb` — fil d'Ariane
```ts
export interface BreadcrumbItem {
  label: string;
  link?: string | any[];   // omets `link` pour l'élément courant (dernier)
}
```
| Membre | Type | Défaut |
|--------|------|--------|
| `items` | `BreadcrumbItem[]` (**requis**) | — |

```ts
readonly crumbs: BreadcrumbItem[] = [
  { label: 'Tickets', link: '/back-office/tickets' },
  { label: 'Ticket #42' },   // courant → pas de link
];
```
```html
<app-breadcrumb [items]="crumbs" />
```

---

## `app-stat-card` — carte d'indicateur (dashboard)
| Membre | Type | Défaut |
|--------|------|--------|
| `label` | `string` | `''` |
| `value` | `string \| number` | `''` |
| `icon` | `string` | `''` |
| `variant` | `'primary' \| 'success' \| 'warning' \| 'danger' \| 'info' \| 'neutral'` | `'neutral'` |

```html
<div class="stats-grid">
  <app-stat-card label="Tickets ouverts" [value]="openCount()" icon="fa-solid fa-ticket" variant="info" />
  <app-stat-card label="Coût total" [value]="totalCost() + ' €'" icon="fa-solid fa-euro-sign" variant="success" />
</div>
```

---

## Imports
```ts
// Composants maison
import { PageHeaderComponent } from '@app/shared/ui/page-header/page-header.component';
import { AvatarComponent } from '@app/shared/ui/avatar/avatar.component';
import { BreadcrumbComponent, BreadcrumbItem } from '@app/shared/ui/breadcrumb/breadcrumb.component';
import { StatCardComponent } from '@app/shared/ui/stat-card/stat-card.component';

// Material direct (remplacent les anciens wrappers)
import { MatCardModule } from '@angular/material/card';        // mat-card
import { MatTabsModule } from '@angular/material/tabs';        // mat-tab-group
import { MatDividerModule } from '@angular/material/divider';  // mat-divider
import { MatButtonModule } from '@angular/material/button';
```

## Pièges récurrents
- Chercher `app-card` / `app-tabs` / `app-divider` : ces wrappers ont été **supprimés**. Utilise Material.
- Oublier `mat-card-header` ou `mat-card-content` → le contenu s'affiche sans le style M3.
- Gérer l'espacement entre cartes avec des marges : utilise une grille parente (`display:grid; gap`).
- Mettre un `link` sur le **dernier** crumb (il doit représenter la page courante, sans lien).
- Recréer des cartes de stats en HTML brut alors que `app-stat-card` existe.
