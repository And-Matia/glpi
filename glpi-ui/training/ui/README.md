# 🎨 Bootcamp UI — Angular Material/CDK + la bibliothèque `shared/ui`

Ce parcours couvre **tout l'outillage UI** du projet. Depuis la refonte, l'UI repose sur
**deux niveaux** :

1. **Angular Material / CDK, utilisés directement** dans les templates pour tout ce qui est
   générique : boutons, cartes, onglets, paginator, tooltip, checkbox, menu, drag & drop…
   → **on ne crée plus de wrapper `app-*` pour ça.**
2. **`shared/ui`** : une bibliothèque réduite de composants maison, gardée uniquement là où un
   wrapper apporte une vraie valeur (API signal propre, logique métier d'affichage, ou look
   spécifique au projet) : formulaires, table, modal, feedback…

Objectif : savoir **choisir le bon niveau** (Material direct vs `app-*`) et connaître l'**API
exacte** de chaque composant maison.

## 📂 Sommaire

| Fichier | Contenu |
|---------|---------|
| `00-material-cdk.md` | **Comment utiliser Material & le CDK** : thème, imports de modules, tableau besoin → solution, drag & drop |
| `01-boutons.md` | **Boutons Material** : `mat-flat-button`, `mat-button`, `mat-stroked-button`, `mat-icon-button`, `color="warn"` |
| `02-formulaires.md` | **Input · Textarea · Select · SearchInput** (wrappers Material) + `mat-checkbox` / `mat-slide-toggle` |
| `03-feedback.md` | **Spinner · Badge · Alert · EmptyState · Toast · ProgressBar · Skeleton** + `matTooltip` / `mat-chip` |
| `04-structure.md` | **PageHeader · Avatar · Breadcrumb · StatCard** + `mat-card` / `mat-tab-group` / `mat-divider` |
| `05-table.md` | **Table** + directive **appCell** (cellules personnalisées, tri, recherche, filtres) |
| `06-overlays.md` | **Modal · ConfirmDialog · Dropzone** (CDK overlay/focus-trap à l'intérieur) |
| `07-pagination.md` | **`mat-paginator`** (le composant `app-pagination` n'existe plus) |
| `08-recettes.md` | **Compositions complètes** (page liste, fiche, formulaire, CRUD avec modale, kanban) |
| `09-kanban.md` | **Kanban CDK** : base, transitions avec modale, WIP limits, densité, filtre technicien, swimlanes |
| `10-modales-avancees.md` | **Modales avancées** : données depuis une modale, modales empilées, drawer coulissant, re-auth à la volée |
| `11-formulaires-avances.md` | **Formulaires avancés** : champs conditionnels, brouillon auto-sauvegardé, wizard, édition en masse, inline editing |
| `12-tableaux-avances.md` | **Tableaux avancés** : tri multi-colonnes, colonnes masquables, lignes extensibles, multi-sélection, export |
| `13-recherche-filtres.md` | **Recherche & filtres** : chips, autocomplete catégorisé, debounce+annulation, favoris, partage URL |
| `14-dashboard-widgets.md` | **Dashboard** : KPI cards + animation, sélecteur période, graphiques CSS, drag-to-reorder, sync indicator |
| `15-permissions-auth.md` | **Permissions & Auth** : route guard, rôles multiples, bandeau protégé, élévation à la volée |

> Pour brancher ces composants à un **service + GLPI** (créer un élément, un utilisateur, éditer,
> supprimer), voir `../docs/13-recettes-features.md`.

---

## 🚦 La règle de décision : Material direct ou `app-*` ?

| Besoin | Solution | Pourquoi |
|--------|----------|----------|
| Bouton (toutes variantes) | **Material direct** (`mat-flat-button`, `mat-button`…) | générique, thémé |
| Carte, onglets, divider, chip, tooltip, checkbox, toggle, menu, datepicker, paginator | **Material direct** | générique, thémé |
| Drag & drop, virtual scroll, focus trap | **CDK direct** (`cdkDrag`, `cdk-virtual-scroll-viewport`…) | primitives |
| Champ de formulaire lié à un signal | `app-input` / `app-textarea` / `app-select` | wrappe `mat-form-field` + expose `[(value)]` signal |
| Tableau de données (tri/recherche/cellules custom) | `app-table` + `appCell` | logique maison |
| Modale / confirmation | `app-modal` / `app-confirm-dialog` | CDK focus-trap + scroll block intégrés |
| Statut coloré, état vide, skeleton, stat… | `app-badge`, `app-empty-state`, etc. | look projet |

**Ne crée jamais un nouveau wrapper `app-*` pour un widget Material existant.** Inversement, ne
réécris pas en HTML brut ce qu'un composant `shared/ui` fait déjà.

---

## 🧭 Rappels de base : comment brancher un composant

Tous les composants maison sont **standalone + OnPush + signals**. Côté parent :

| Le composant expose… | Tu écris dans le template parent | Sens |
|----------------------|----------------------------------|------|
| `input<T>()` | `[prop]="valeur"` (ou `prop="texte"` si littéral) | parent → enfant |
| `input.required<T>()` | **obligatoire** : `[prop]="valeur"` | parent → enfant |
| `output<T>()` | `(event)="handler($event)"` | enfant → parent |
| `model<T>()` | `[(prop)]="monSignal"` (ou `[prop]`/`(propChange)`) | bidirectionnel |
| `<ng-content>` | tout ce que tu mets **entre les balises** | projection |
| `<ng-content select="[slot=x]">` | un élément avec `slot="x"` | projection nommée |

**Exemple complet :**
```html
<button mat-flat-button [disabled]="submitting()" (click)="save()">Enregistrer</button>

<app-input label="Titre" [(value)]="titre" />        <!-- model bidirectionnel -->
<app-modal [open]="modalOpen()" (closed)="modalOpen.set(false)">…</app-modal>
```

> ⚠️ **Penser à `imports`** : un composant standalone (maison **ou** module Material) utilisé
> dans un template doit figurer dans le tableau `imports: [...]` du `@Component`. Pour Material,
> on importe le **module** : `MatButtonModule`, `MatCardModule`… Sinon : erreur de template.
> Un composant importé **mais non utilisé** → warning `NG8113`.

---

## 🗺️ Cheat-sheet : tous les composants `shared/ui` d'un coup d'œil

| Composant | Sélecteur | Entrées principales | Sorties | `[(model)]` | Projection |
|-----------|-----------|---------------------|---------|-------------|------------|
| Input | `app-input` | `label`*, `placeholder`, `errorMessage`, `type` | — | `value` | — |
| Textarea | `app-textarea` | `label`*, `placeholder`, `errorMessage`, `rows` | — | `value` | — |
| Select | `app-select` | `label`*, `options`*, `placeholder`, `errorMessage` | — | `value` | — |
| SearchInput | `app-search-input` | `placeholder`, `disabled` | `search` | `value` | — |
| Badge | `app-badge` | `variant`, `size` | — | — | contenu |
| Spinner | `app-spinner` | `size` | — | — | — |
| EmptyState | `app-empty-state` | `icon`, `title`, `message` | — | — | — |
| Toast | `app-toast` | *(piloté par `ToastService`)* | — | — | — |
| PageHeader | `app-page-header` | `title`*, `subtitle` | — | — | actions |
| Avatar | `app-avatar` | `name`, `src`, `size` | — | — | — |
| Table | `app-table` | `columns`*, `rows`*, `searchKeys`, `showToolbar`, `emptyIcon`, `emptyLabel` | — | — | `ng-template[appCell]` |
| Modal | `app-modal` | `open`*, `title`, `size` | `closed` | — | corps + `[slot=footer]` |
| ConfirmDialog | `app-confirm-dialog` | `open`*, `title`, `message`, `confirmLabel`, `cancelLabel`, `danger` | `confirmed`, `cancelled` | — | — |
| Alert | `app-alert` | `variant`, `title`, `icon`, `dismissible` | `dismissed` | — | message |
| ProgressBar | `app-progress-bar` | `value`, `max`, `variant`, `showLabel` | — | — | — |
| Skeleton | `app-skeleton` | `width`, `height`, `circle` | — | — | — |
| Breadcrumb | `app-breadcrumb` | `items`* | — | — | — |
| StatCard | `app-stat-card` | `label`, `value`, `icon`, `variant` | — | — | — |
| Dropzone | `app-dropzone` | `accept`, `multiple`, `disabled`, `label`, `hint`, `icon` | `filesSelected` | — | — |

`*` = entrée **obligatoire** (`input.required`).

> 🪦 **Composants supprimés** (remplacés par Material — ne les cherche plus) :
> `app-button` → `mat-flat-button`/`mat-button` · `app-icon-button` → `mat-icon-button` ·
> `app-card` → `mat-card` · `app-tabs` → `mat-tab-group` · `app-tooltip` → `matTooltip` ·
> `app-checkbox` → `mat-checkbox` · `app-switch` → `mat-slide-toggle` · `app-chip` → `mat-chip` ·
> `app-divider` → `mat-divider` · `app-pagination` → `mat-paginator`.

---

## 🎨 Rappel design tokens & thème (voir `../docs/08-ui-ux-styles.md`)

- Les composants maison stylent via les **tokens CSS** (`--spacing-*`, `--color-*`, `--radius-*`,
  `--font-size-*`) définis dans `src/styles/variables.css` et `src/styles/colors.css`.
- Les composants **Material** sont thémés globalement dans `src/material-theme.scss`
  (palette générée depuis le jaune `#FFD600` + overrides `mat.theme-overrides`). Tu n'as **rien
  à configurer par composant** : `mat-flat-button` sort déjà aux couleurs du projet.
- Quand tu poses un composant, gère son **espacement depuis le parent** (flex/grid + `gap`),
  pas avec des marges en dur.

Bon parcours — commence par `00-material-cdk.md`.
