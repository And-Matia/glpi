# 07 — Pagination : `app-pagination`

Pour découper une longue liste en pages. Le composant **ne coupe pas** les données lui-même : il
gère seulement le **numéro de page courant** ; à toi de dériver la tranche visible.

## API exacte
| Membre | Type | Défaut |
|--------|------|--------|
| `total` | `number` (**requis**) | — (nombre **total** d'éléments) |
| `pageSize` | `number` | `10` |
| `page` | `model<number>(1)` | `1` (**two-way**, 1-based) |

Le composant calcule en interne `totalPages = ceil(total / pageSize)` et la fenêtre de numéros.

## Recette complète (liste paginée)
```ts
readonly all      = signal<Row[]>([]);     // données complètes
readonly page     = signal(1);
readonly pageSize = 10;

readonly paged = computed(() => {
  const start = (this.page() - 1) * this.pageSize;
  return this.all().slice(start, start + this.pageSize);
});
```
```html
<app-table [columns]="columns" [rows]="paged()" />

<app-pagination
  [total]="all().length"
  [pageSize]="pageSize"
  [(page)]="page" />
```

## Avec recherche/filtre : paginer la liste **filtrée**, et revenir page 1
```ts
readonly q        = signal('');
readonly page     = signal(1);
readonly pageSize = 10;

readonly filtered = computed(() => {
  const t = this.q().toLowerCase().trim();
  return !t ? this.all() : this.all().filter(r => r.name.toLowerCase().includes(t));
});

readonly paged = computed(() => {
  const start = (this.page() - 1) * this.pageSize;
  return this.filtered().slice(start, start + this.pageSize);
});

// Revenir à la page 1 quand la recherche change (sinon page vide)
constructor() {
  effect(() => { this.q(); this.page.set(1); });
}
```
```html
<app-search-input [(value)]="q" />
<app-table [columns]="columns" [rows]="paged()" [showToolbar]="false" />
<app-pagination [total]="filtered().length" [pageSize]="pageSize" [(page)]="page" />
```

## Import
```ts
import { PaginationComponent } from '@app/shared/ui/pagination/pagination.component';
```

## Pièges récurrents
- Passer `total = nombre de la page` au lieu du **total global** → la pagination disparaît.
- Oublier de **remettre `page` à 1** quand un filtre réduit la liste → on reste sur une page
  désormais vide.
- Paginer la liste brute alors qu'un filtre est actif → paginer **`filtered()`**, pas `all()`.
- `page` est **1-based** : la tranche est `(page-1) * pageSize`.
