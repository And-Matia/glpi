# 05 — Tableau : `app-table` + directive `appCell`

Le composant le plus puissant. Il gère : colonnes, **tri**, **recherche globale**, **filtres par
colonne**, état vide, et **cellules personnalisées** (badges, boutons, avatars) via `appCell`.

---

## Types
```ts
export interface TableColumn {
  key:         string;                         // clé dans l'objet ligne
  label:       string;                         // en-tête affiché
  sortable?:   boolean;                        // active le tri sur cette colonne
  searchable?: boolean;                        // ajoute un champ de filtre sous l'en-tête
  align?:      'left' | 'center' | 'right';
  width?:      string;                         // ex. '120px'
}
```

## API exacte
| Membre | Type | Défaut |
|--------|------|--------|
| `columns` | `TableColumn[]` (**requis**) | — |
| `rows` | `Record<string, any>[]` (**requis**) | — |
| `searchKeys` | `string[]` | `[]` (vide = toutes les colonnes) |
| `showToolbar` | `boolean` | `true` (barre de recherche + compteur) |
| `emptyIcon` | `string` | `'fa-solid fa-inbox'` |
| `emptyLabel` | `string` | `'Aucun résultat'` |
| *(projection)* | `ng-template[appCell]` | cellules personnalisées |

---

## Exemple minimal
```ts
readonly columns: TableColumn[] = [
  { key: 'name',   label: 'Nom',  sortable: true },
  { key: 'status', label: 'Statut' },
];
readonly rows = signal<Record<string, any>[]>([]);
```
```html
<app-table [columns]="columns" [rows]="rows()" />
```

---

## Cellules personnalisées : la directive `appCell`

Pour rendre autre chose que du texte dans une colonne, projette un `<ng-template appCell="<key>">`.

### ⚠️ Le piège n°1 du projet : `let-value="value"`
Le contexte fourni par la table est :
```ts
{ $implicit: row, value: row[col.key] }
```
- `let-row` (ou `let-x`) → lie à **`$implicit`** = la **ligne entière**.
- `let-value="value"` → lie à la **valeur de la cellule**.

Donc pour afficher la valeur d'une cellule, **il faut `let-value="value"`**. Écrire `let-value`
(sans `="value"`) lie en réalité à `$implicit` (la ligne) → tu obtiens `[object Object]`.

```html
<app-table [columns]="columns" [rows]="rows()">
  <!-- ✅ valeur de cellule -->
  <ng-template appCell="status" let-value="value">
    <app-badge [variant]="statusVariant(value)" size="sm">{{ value }}</app-badge>
  </ng-template>

  <!-- ✅ ligne entière (pour des actions qui ont besoin de l'id, etc.) -->
  <ng-template appCell="actions" let-row>
    <app-icon-button icon="fa-solid fa-eye" ariaLabel="Voir" (clicked)="open(row)" />
  </ng-template>

  <!-- ✅ les deux à la fois -->
  <ng-template appCell="user" let-value="value" let-row>
    @if (value) {
      <span class="user"><app-avatar [name]="value" size="sm" /> {{ value }}</span>
    } @else { <span class="muted">—</span> }
  </ng-template>
</app-table>
```

---

## Tri, recherche, filtres
- **Tri** : `sortable: true` sur la colonne → clic sur l'en-tête (asc → desc → asc). Le tri est
  alphanumérique (`localeCompare` avec `numeric: true`), géré **dans le composant table**.
- **Recherche globale** : visible si `showToolbar` (défaut `true`). Cherche dans `searchKeys`
  (ou toutes les colonnes si vide).
- **Filtre par colonne** : `searchable: true` ajoute un petit champ sous l'en-tête.

```ts
readonly columns: TableColumn[] = [
  { key: 'ref_ticket', label: 'Réf.',   sortable: true, width: '80px'  },
  { key: 'titre',      label: 'Titre',  sortable: true, searchable: true },
  { key: 'status',     label: 'Statut', sortable: true, width: '160px' },
  { key: 'actions',    label: '',                        width: '80px'  },
];
```
```html
<app-table [columns]="columns" [rows]="rows()" [searchKeys]="['titre','ref_ticket','status']">
  …
</app-table>
```

> Si tu fais **ta propre** barre de recherche au-dessus (cas front-office `item-list`), passe
> `[showToolbar]="false"` pour ne pas avoir deux champs.

---

## Préparer les `rows`
La table affiche `row[col.key]` tel quel. Donc **aplatis et formate** la donnée AVANT (dans un
`computed`/`map`), pas dans le template :
```ts
readonly rows = computed(() => this.items().map(i => ({
  id:        i.id,                    // gardé pour les actions, même sans colonne
  name:      i.name,
  item_type: assetLabel(i.item_type), // libellé FR, pas le code
  status:    i.status,
})));
```
> Une clé non déclarée en colonne (ex. `id`) reste accessible dans `appCell` via `let-row`.

---

## Imports
```ts
import { TableComponent, TableColumn } from '@app/shared/ui/table/table.component';
import { TableCellDirective } from '@app/shared/ui/table/table-cell.directive';
// @Component({ imports: [TableComponent, TableCellDirective] })
```
> ⚠️ `TableCellDirective` doit être **importé séparément** dès que tu utilises `appCell`.

## Pièges récurrents
1. **`let-value` sans `="value"`** → `[object Object]`. Toujours `let-value="value"`.
2. Oublier d'importer `TableCellDirective` → le `appCell` est ignoré silencieusement.
3. Formater dans le template au lieu de préparer `rows` en amont.
4. Deux barres de recherche (toolbar interne + la tienne) → `[showToolbar]="false"`.
5. Mettre un objet (`{name:…}`) comme valeur de cellule → `[object Object]`. Aplatis en string.
