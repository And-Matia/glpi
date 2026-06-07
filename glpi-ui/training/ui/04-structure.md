# 04 — Structure : `PageHeader`, `Card`, `Divider`, `Avatar`, `Tabs`, `Breadcrumb`, `StatCard`

Les composants qui **organisent** une page : en-tête, conteneurs, séparateurs, navigation interne,
indicateurs.

---

## `app-page-header` — en-tête de page (titre + actions)
| Membre | Type | Défaut |
|--------|------|--------|
| `title` | `string` (**requis**) | — |
| `subtitle` | `string` | `''` |
| *(contenu)* | `ng-content` | les **actions** à droite (boutons) |

```html
<app-page-header title="Tickets" subtitle="Liste de tous les tickets GLPI">
  <app-button (clicked)="create()">Nouveau</app-button>
</app-page-header>
```
> Toute page de feature commence par un `app-page-header`. Les boutons projetés se placent
> automatiquement à droite.

---

## `app-card` — conteneur encadré
| Membre | Type | Défaut |
|--------|------|--------|
| `title` | `string` | `''` |
| `padding` | `boolean` | `true` |
| *(contenu)* | `ng-content` | le corps |
| `[slot=header-actions]` | projection nommée | boutons dans l'en-tête de la carte |

```html
<app-card title="Informations">
  <app-button slot="header-actions" variant="ghost" (clicked)="edit()">Modifier</app-button>
  <p>Nom : {{ item().name }}</p>
</app-card>

<!-- Carte sans padding (ex. pour y mettre un tableau pleine largeur) -->
<app-card [padding]="false">
  <app-table [columns]="cols" [rows]="rows()" />
</app-card>
```

---

## `app-divider` — séparateur (optionnellement avec libellé)
| Membre | Type | Défaut |
|--------|------|--------|
| `label` | `string` | `''` |

```html
<app-divider />
<app-divider label="Éléments liés" />
```

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

## `app-tabs` — onglets internes
```ts
export interface Tab { key: string; label: string; icon?: string; badge?: string | number; }
```
| Membre | Type | Défaut |
|--------|------|--------|
| `tabs` | `Tab[]` (**requis**) | — |
| `activeKey` | `model<string>` (**requis**) | — (**two-way**) |

```ts
readonly tabs: Tab[] = [
  { key: 'infos',  label: 'Informations', icon: 'fa-solid fa-circle-info' },
  { key: 'items',  label: 'Éléments liés', badge: 3 },
];
readonly activeTab = signal('infos');
```
```html
<app-tabs [tabs]="tabs" [(activeKey)]="activeTab" />

@switch (activeTab()) {
  @case ('infos') { <!-- contenu onglet 1 --> }
  @case ('items') { <!-- contenu onglet 2 --> }
}
```
> `activeKey` est **requis** et bidirectionnel → fournis toujours un signal initialisé sur une
> `key` existante.

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
import { PageHeaderComponent } from '@app/shared/ui/page-header/page-header.component';
import { CardComponent } from '@app/shared/ui/card/card.component';
import { DividerComponent } from '@app/shared/ui/divider/divider.component';
import { AvatarComponent } from '@app/shared/ui/avatar/avatar.component';
import { TabsComponent, Tab } from '@app/shared/ui/tabs/tabs.component';
import { BreadcrumbComponent, BreadcrumbItem } from '@app/shared/ui/breadcrumb/breadcrumb.component';
import { StatCardComponent } from '@app/shared/ui/stat-card/stat-card.component';
```

## Pièges récurrents
- Oublier d'initialiser `activeKey` des `Tabs` (requis) → erreur.
- Mettre un `link` sur le **dernier** crumb (il doit représenter la page courante, sans lien).
- Recréer des cartes de stats en HTML brut alors que `app-stat-card` existe.
- Gérer l'espacement entre cartes avec des marges : utilise une grille parente (`display:grid; gap`).
