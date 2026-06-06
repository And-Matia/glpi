# 07 — Les composants UI réutilisables

`shared/ui/` contient une **bibliothèque de composants de présentation**. Ils sont « bêtes »
(aucune logique métier, aucun appel réseau), pilotés par `input()`/`output()`/`model()`.
**Réutilise-les au maximum** plutôt que d'écrire du HTML brut.

## 1. Catalogue (sélecteur → entrées principales)

| Composant | Sélecteur | Entrées clés | Sorties |
|-----------|-----------|--------------|---------|
| Button | `app-button` | `variant`, `size`, `loading`, `disabled` | `(clicked)` |
| Badge | `app-badge` | `variant`, `size` | — |
| Input | `app-input` | `label`, `[(value)]`, `errorMessage`, `type` | — |
| Textarea | `app-textarea` | `label`, `[(value)]`, `rows`, `errorMessage` | — |
| Select | `app-select` | `label`, `options`, `[(value)]`, `errorMessage` | — |
| SearchInput | `app-search-input` | `placeholder`, `[(value)]` | `(search)` |
| Table | `app-table` | `columns`, `rows`, `searchKeys` | — |
| Modal | `app-modal` | `[open]`, `title`, `size` | `(closed)` |
| ConfirmDialog | `app-confirm-dialog` | `[open]`, `title`, `message`, `[danger]` | `(confirmed)`, `(cancelled)` |
| Card | `app-card` | `title`, `[padding]` | (slot `header-actions`) |
| Spinner | `app-spinner` | `size` | — |
| Tabs | `app-tabs` | `tabs`, `[(activeKey)]` | — |
| Avatar | `app-avatar` | `name`, `src`, `size` | — |
| Pagination | `app-pagination` | `total`, `pageSize`, `[(page)]` | — |
| Tooltip | `app-tooltip` | `text`, `position` | — |
| Divider | `app-divider` | `label` | — |
| PageHeader | `app-page-header` | `title`, `subtitle` | (ng-content pour actions) |
| EmptyState | `app-empty-state` | `icon`, `title`, `message` | — |
| Toast | `app-toast` | — (lit `ToastService`) | — |

## 2. Anatomie d'un composant UI (`button.component.ts`)

```ts
export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize    = 'sm' | 'md' | 'lg';

@Component({
  selector: 'app-button',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './button.component.html', styleUrl: './button.component.css',
})
export class ButtonComponent {
  variant  = input<ButtonVariant>('primary');
  size     = input<ButtonSize>('md');
  loading  = input<boolean>(false);
  disabled = input<boolean>(false);
  clicked  = output<void>();

  onClick() { if (!this.disabled() && !this.loading()) this.clicked.emit(); }
}
```
Remarque : les **variantes** sont des *union types* exportés. Tu les réutilises côté parent
pour bénéficier de l'autocomplétion. Le composant gère lui-même le « ne pas émettre si
disabled/loading ».

## 3. Utilisation côté page

```html
<app-page-header title="Import des données" subtitle="…" />

<app-card title="Étape 1">
  <app-button variant="primary" [loading]="isProcessing()" [disabled]="!canImport()"
              (clicked)="startImport()">
    Lancer l'importation
  </app-button>
</app-card>

@if (step.status === 'validated') { <app-badge variant="success">Valide</app-badge> }
```

### Champs de formulaire (liaison bidirectionnelle)
```html
<app-input    label="Titre *"        [(value)]="titre" />
<app-textarea label="Description *"  [(value)]="description" [rows]="5" />
<app-select   label="Type *"         [options]="typeOptions" [(value)]="type" />
<app-search-input placeholder="Rechercher…" [(value)]="searchText" />
```
`[(value)]="signal"` fonctionne car ces composants exposent `value = model<…>()`.
`typeOptions` est un `SelectOption[]` (`{ value, label }`) — souvent centralisé dans
`glpi.constants.ts` (`TICKET_TYPE_OPTIONS`, `ASSET_TYPE_OPTIONS`, `ITEM_STATUS_OPTIONS`).

## 4. La table (`app-table`)

Composant générique piloté par des **colonnes** et des **lignes** :

```ts
readonly columns: TableColumn[] = [
  { key: 'ref_ticket', label: 'Réf.',     sortable: true, width: '80px'  },
  { key: 'titre',      label: 'Titre',     sortable: true                 },
  { key: 'status',     label: 'Statut',    sortable: true, width: '160px' },
  { key: 'actions',    label: '',                          width: '80px'  },
];
readonly rows = signal<Record<string, any>[]>([]);
```
```html
<app-table [columns]="columns" [rows]="rows()" />
```
Les `rows` sont des objets **déjà préparés** (labels traduits, valeurs formatées) — la table
n'a pas de logique métier. C'est au composant de transformer `Ticket[]` → lignes affichables
(souvent via un `computed` ou dans le `.subscribe`).

## 5. Dialogues : Modal & ConfirmDialog

```html
<app-confirm-dialog
  [open]="confirmOpen()"
  title="Réinitialiser les données"
  message="Action irréversible. Continuer ?"
  confirmLabel="Oui, tout supprimer"
  [danger]="true"
  (confirmed)="onConfirmed()"
  (cancelled)="onCancelled()" />
```
Pattern : un `signal<boolean>` (`confirmOpen`) pilote `[open]`, et on réagit aux sorties.

## 6. Projection de contenu (`<ng-content>`)

`PageHeader` projette des actions, `Card` projette son contenu :
```html
<app-page-header [title]="'Ticket #' + t.ref_ticket" [subtitle]="t.titre">
  <app-button variant="ghost" size="sm" (clicked)="goBack()">← Retour</app-button>
</app-page-header>
```
Tout ce que tu mets **entre les balises** du composant est projeté via `<ng-content>`.
Certains composants utilisent des **slots nommés** (`slot="footer"` pour `Modal`,
`slot="header-actions"` pour `Card`).

## 7. Icônes FontAwesome

Chargé via CDN dans `index.html`. Usage : une balise `<i>` avec les classes :
```html
<i class="fa-solid fa-circle-check"></i>
<i class="fa-regular fa-circle"></i>
<i [class]="stepIcons[$index]" class="step-icon"></i>   <!-- classe dynamique -->
```
`fa-solid` / `fa-regular` = style ; `fa-xxx` = icône. Si **aucune icône ne s'affiche**, c'est
que la feuille FA n'est pas chargée (voir doc 12).

## 8. Quand créer un nouveau composant `shared/ui` ?

- Si tu réécris **3 fois** le même bout d'UI → fais-en un composant.
- Il doit rester **générique** (pas de logique métier, pas d'appel service).
- Entrées via `input()`, sorties via `output()`, formulaire via `model()`.
- `OnPush` + template/style séparés (convention du dossier).

## 9. Erreurs fréquentes

| ❌ | ✅ |
|----|----|
| HTML brut `<input>` pour une recherche | `app-search-input [(value)]` |
| Mettre un appel HTTP dans un composant `ui` | non : il reste présentationnel |
| Oublier d'ajouter le composant à `imports` | l'ajouter (sinon erreur de template) |
| Passer des entités brutes à `app-table` | préparer des `rows` affichables d'abord |
| Réinventer un badge de statut | `app-badge variant="…"` |

➡️ Ensuite : **`08-ui-ux-styles.md`**.
