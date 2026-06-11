# 07 — Pagination : `mat-paginator` (Angular Material)

> 🪦 `app-pagination` **n'existe plus**. La pagination est assurée par `mat-paginator`
> d'Angular Material, utilisé directement.

```ts
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
```

---

## Comment ça marche

`mat-paginator` affiche les contrôles (précédent, suivant, sélecteur de taille de page) et émet
un `(page)` à chaque changement. **Il ne coupe pas les données lui-même** : tu tranches le
tableau dans un `computed` en fonction de `pageIndex` et `pageSize`.

> ⚠️ `mat-paginator` est **0-based** (`pageIndex` commence à 0). Adapte le calcul de la tranche.

---

## Recette complète (liste paginée)

```ts
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';

readonly all       = signal<Row[]>([]);
readonly pageIndex = signal(0);   // 0-based
readonly pageSize  = signal(10);

readonly paged = computed(() => {
  const start = this.pageIndex() * this.pageSize();
  return this.all().slice(start, start + this.pageSize());
});

onPage(e: PageEvent): void {
  this.pageIndex.set(e.pageIndex);
  this.pageSize.set(e.pageSize);
}
```
```html
<app-table [columns]="columns" [rows]="paged()" />

<mat-paginator
  [length]="all().length"
  [pageSize]="pageSize()"
  [pageSizeOptions]="[10, 25, 50]"
  [pageIndex]="pageIndex()"
  (page)="onPage($event)" />
```

---

## Avec recherche/filtre : paginer la liste filtrée, revenir page 0

```ts
readonly q         = signal('');
readonly pageIndex = signal(0);
readonly pageSize  = signal(10);

readonly filtered = computed(() => {
  const t = this.q().toLowerCase().trim();
  return !t ? this.all() : this.all().filter(r => r.name.toLowerCase().includes(t));
});

readonly paged = computed(() => {
  const start = this.pageIndex() * this.pageSize();
  return this.filtered().slice(start, start + this.pageSize());
});

onPage(e: PageEvent): void {
  this.pageIndex.set(e.pageIndex);
  this.pageSize.set(e.pageSize);
}

constructor() {
  // Revenir à la page 0 quand la recherche change (sinon page vide)
  effect(() => { this.q(); this.pageIndex.set(0); });
}
```
```html
<app-search-input [(value)]="q" />
<app-table [columns]="columns" [rows]="paged()" [showToolbar]="false" />

<mat-paginator
  [length]="filtered().length"
  [pageSize]="pageSize()"
  [pageSizeOptions]="[10, 25, 50]"
  [pageIndex]="pageIndex()"
  (page)="onPage($event)" />
```

---

## Import
```ts
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
// @Component({ imports: [MatPaginatorModule] })
```

## Pièges récurrents
- `pageIndex` est **0-based** (pas 1-based comme l'ancien `app-pagination`) → tranche = `pageIndex * pageSize`.
- Passer `length = nombre de la page` au lieu du **total global** (ou du total filtré) → la
  navigation disparaît.
- Oublier de **remettre `pageIndex` à 0** quand un filtre réduit la liste → on reste sur une
  page désormais vide.
- Paginer la liste brute alors qu'un filtre est actif → paginer **`filtered()`**, pas `all()`.
- Passer `[length]="all().length"` alors qu'un filtre est actif → `mat-paginator` calcule un
  mauvais nombre de pages.
