# 08 — UI / UX & styles (design tokens)

## 1. Règle d'or : **jamais de valeur en dur**

CLAUDE.md l'impose : « CSS uses design tokens only (never hard-coded values) ». Toute valeur
(couleur, espacement, taille, rayon, ombre) doit venir d'une **variable CSS** définie dans
`src/styles/`.

```css
/* ❌ interdit */            /* ✅ correct */
padding: 16px;               padding: var(--spacing-4);
color: #1A1A1A;              color: var(--color-text);
border-radius: 8px;          border-radius: var(--radius-md);
```

## 2. Où sont les tokens

```
src/styles/
├── colors.css     ← palette + couleurs sémantiques (success/danger/warning/info) + alias
├── variables.css  ← espacements, tailles de police, poids, rayons, ombres, z-index
└── globals.css    ← reset CSS, typographie de base, quelques utilitaires
```
`src/styles.css` les importe tous. (`globals.css` réimporte aussi colors/variables.)

## 3. Les échelles disponibles

### Espacements (deux conventions, mêmes valeurs)
```css
--space-4 … --space-64       /* échelle "px-suffixée"  (utilisée par shared/ui) */
--spacing-1 … --spacing-12   /* échelle "numérique 4px" (utilisée par les features) */
```
> ℹ️ Historique : `shared/ui` utilise `--space-*`, les features utilisent `--spacing-*`.
> **Les deux sont définies** et cohérentes (`--spacing-4` = 16px = `--space-16`). Utilise la
> convention déjà présente dans le fichier que tu modifies pour rester homogène.

### Typographie
```css
--text-11 … --text-32                 /* tailles px-suffixées */
--font-size-xs … --font-size-3xl      /* tailles nommées */
--weight-regular / -medium / -semibold / -bold
```

### Rayons & ombres
```css
--radius-2/4/8/12/16/full   et alias  --radius-sm (4) / --radius-md (8) / --radius-lg (12)
--shadow-sm / --shadow-md / --shadow-lg
--transition-fast / -base / -slow
```

### Couleurs (extrait)
```css
--color-primary: #FFD600;   --color-accent: #F5A623;
--color-success/-bg/-text;  --color-danger/-bg/-text;  --color-warning…;  --color-info…
--color-text-primary/-secondary/-muted;  --color-border/-border-strong;
--color-surface; --color-white;
/* alias sémantiques : */
--color-text (=text-primary); --color-bg (=surface); --color-bg-primary (=white); --color-bg-secondary (=surface)
```

> ⚠️ **Piège réel rencontré :** des composants référençaient des tokens **non définis**
> (`--spacing-6`, `--font-size-sm`, `--radius-md`, `--color-text`). Une variable CSS
> inexistante = propriété **ignorée** → marges/polices cassées **silencieusement** (aucune
> erreur). On a corrigé en **définissant** ces tokens. Réflexe : si un espacement « ne prend
> pas », vérifie que le token existe vraiment dans `variables.css`/`colors.css`.

## 4. Conventions de nommage CSS (BEM léger)

Les classes suivent un BEM allégé : `bloc__element--modificateur`.
```css
.item-list { … }
.item-list__filters { … }
.item-list__search { … }
.drop-zone--active { … }
.items-panel__item--selected { … }
```
Le **scope** est assuré par Angular (styles encapsulés par composant), donc pas besoin de
préfixer agressivement, mais on garde des noms parlants.

## 5. Layout : flexbox + grid + gap

Modèle récurrent : un conteneur en colonne avec un `gap` régulier, et des grilles pour les
zones à deux colonnes.
```css
.dashboard       { display: flex; flex-direction: column; gap: var(--spacing-6); }
.ticket-detail__grid { display: grid; grid-template-columns: 340px 1fr; gap: var(--spacing-4); align-items: start; }
.item-list__filters  { display: flex; gap: var(--spacing-4); align-items: flex-end; flex-wrap: wrap; }
```
> 🧠 Pour qu'un champ s'étire dans une rangée de filtres : `flex: 1; min-width: 220px;`
> sur l'élément (ex. `.item-list__search`).

## 6. Patterns UX du projet

- **États de chargement** : `@if (loading()) { <app-spinner size="lg" /> }`.
- **État vide** : `@empty` dans `@for`, ou `<app-empty-state>`.
- **Erreurs** : message en `--color-danger`, ou toast (`ToastService`).
- **Confirmation d'action destructive** : `app-confirm-dialog` avec `[danger]="true"`.
- **Feedback d'action** : `toast.success(...)` / `toast.error(...)`.
- **En-tête de page** : toujours `app-page-header` (titre + sous-titre + actions projetées).
- **Regroupement** : `app-card` pour chaque bloc logique.
- **Statuts colorés** : `app-badge` avec la bonne `variant`.

## 7. Ergonomie : check-list avant de livrer une page

- [ ] Tous les espacements/couleurs viennent de tokens (zéro valeur en dur).
- [ ] La page a un `app-page-header`.
- [ ] Les blocs sont des `app-card`, avec un `gap` régulier.
- [ ] États gérés : chargement (spinner), vide (empty-state/@empty), erreur (message/toast).
- [ ] Les actions destructives passent par `app-confirm-dialog`.
- [ ] Les champs utilisent les composants `ui` (`app-input`, `app-select`, `app-search-input`).
- [ ] Les icônes `fa-*` s'affichent (FA chargé).
- [ ] Rendu responsive correct (flex-wrap, grilles qui s'adaptent).

## 8. Erreurs fréquentes

| ❌ | ✅ |
|----|----|
| `padding: 12px` | `padding: var(--spacing-3)` |
| Référencer un token inexistant | vérifier qu'il est défini dans `styles/` |
| Couleur hexadécimale en dur | utiliser un token `--color-*` |
| Réécrire un input stylé à la main | utiliser `app-input`/`app-search-input` |
| Oublier l'état « vide » d'une liste | `@empty` / `app-empty-state` |

➡️ Ensuite : le cœur métier, **`09-workflow-import-reset.md`**.
