# 🎨 Bootcamp UI — la bibliothèque `shared/ui` de A à Z

Ce parcours couvre **tous** les composants réutilisables du projet : à quoi ils servent,
leur **API exacte** (inputs / outputs / model / slots), des **exemples** (minimal + réel) et
les **pièges**. Objectif : ne plus jamais écrire de HTML brut quand un composant existe.

## 📂 Sommaire

| Fichier | Composants couverts |
|---------|---------------------|
| `01-boutons.md` | **Button** |
| `02-formulaires.md` | **Input · Textarea · Select · SearchInput** |
| `03-feedback.md` | **Spinner · Badge · EmptyState · Toast · Tooltip** |
| `04-structure.md` | **PageHeader · Card · Divider · Avatar · Tabs** |
| `05-table.md` | **Table** + directive **appCell** (cellules personnalisées, tri, recherche, filtres) |
| `06-overlays.md` | **Modal · ConfirmDialog** |
| `07-pagination.md` | **Pagination** |
| `08-recettes.md` | **Compositions complètes** (page liste, fiche, formulaire, CRUD avec modale) |

---

## 🧭 Rappels de base : comment brancher un composant

Tous les composants sont **standalone + OnPush + signals**. Côté parent, la façon de les
brancher dépend du type de membre exposé :

| Le composant expose… | Tu écris dans le template parent | Sens |
|----------------------|----------------------------------|------|
| `input<T>()` | `[prop]="valeur"` (ou `prop="texte"` si littéral) | parent → enfant |
| `input.required<T>()` | **obligatoire** : `[prop]="valeur"` | parent → enfant |
| `output<T>()` | `(event)="handler($event)"` | enfant → parent |
| `model<T>()` | `[(prop)]="monSignal"` (ou `[prop]`/`(propChange)`) | bidirectionnel |
| `<ng-content>` | tout ce que tu mets **entre les balises** | projection |
| `<ng-content select="[slot=x]">` | un élément avec `slot="x"` | projection nommée |

**Exemple complet, qui illustre les 4 cas :**
```html
<app-button
  variant="danger"                       <!-- input littéral -->
  [loading]="isSaving()"                  <!-- input lié -->
  (clicked)="save()">                     <!-- output -->
  Enregistrer                             <!-- ng-content -->
</app-button>

<app-input label="Titre" [(value)]="titre" />   <!-- model bidirectionnel -->
```

> ⚠️ **Penser à `imports`** : un composant standalone que tu utilises dans un template doit
> figurer dans le tableau `imports: [...]` du `@Component`. Sinon : erreur de template. Et un
> composant importé **mais non utilisé** → warning `NG8113`.

---

## 🗺️ Cheat-sheet : tous les composants d'un coup d'œil

| Composant | Sélecteur | Entrées principales | Sorties | `[(model)]` | Projection |
|-----------|-----------|---------------------|---------|-------------|------------|
| Button | `app-button` | `variant`, `size`, `loading`, `disabled` | `clicked` | — | label |
| Input | `app-input` | `label`*, `placeholder`, `errorMessage`, `type` | — | `value` | — |
| Textarea | `app-textarea` | `label`*, `placeholder`, `errorMessage`, `rows` | — | `value` | — |
| Select | `app-select` | `label`*, `options`*, `placeholder`, `errorMessage` | — | `value` | — |
| SearchInput | `app-search-input` | `placeholder`, `disabled` | `search` | `value` | — |
| Badge | `app-badge` | `variant`, `size` | — | — | contenu |
| Spinner | `app-spinner` | `size` | — | — | — |
| EmptyState | `app-empty-state` | `icon`, `title`, `message` | — | — | — |
| Toast | `app-toast` | *(piloté par `ToastService`)* | — | — | — |
| Tooltip | `app-tooltip` | `text`*, `position` | — | — | élément enveloppé |
| PageHeader | `app-page-header` | `title`*, `subtitle` | — | — | actions |
| Card | `app-card` | `title`, `padding` | — | — | corps + `[slot=header-actions]` |
| Divider | `app-divider` | `label` | — | — | — |
| Avatar | `app-avatar` | `name`, `src`, `size` | — | — | — |
| Tabs | `app-tabs` | `tabs`* | — | `activeKey`* | — |
| Table | `app-table` | `columns`*, `rows`*, `searchKeys`, `showToolbar`, `emptyIcon`, `emptyLabel` | — | — | `ng-template[appCell]` |
| Modal | `app-modal` | `open`*, `title`, `size` | `closed` | — | corps + `[slot=footer]` |
| ConfirmDialog | `app-confirm-dialog` | `open`*, `title`, `message`, `confirmLabel`, `cancelLabel`, `danger` | `confirmed`, `cancelled` | — | — |
| Pagination | `app-pagination` | `total`*, `pageSize` | — | `page` | — |

`*` = entrée **obligatoire** (`input.required` / `model.required`).

---

## 🎨 Rappel design tokens (voir `../docs/08-ui-ux-styles.md`)
Tous ces composants stylent via tokens (`--spacing-*`, `--color-*`, `--radius-*`, `--font-size-*`).
Quand tu poses un composant, gère son **espacement** depuis le parent (flex/grid + `gap`),
pas avec des marges en dur.

Bon parcours — commence par `01-boutons.md`.
