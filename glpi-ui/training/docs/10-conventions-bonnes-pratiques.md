# 10 — Conventions de code & bonnes pratiques

Respecter ces conventions = ton code « ressemble » au reste du projet (critère implicite
d'examen). Elles viennent de `CLAUDE.md` et de l'observation du code.

## 1. Conventions Angular obligatoires

| Règle | Détail |
|-------|--------|
| **Standalone components** | pas de `NgModule` ; `imports: [...]` dans le `@Component` |
| **`ChangeDetectionStrategy.OnPush`** | sur **tous** les composants |
| **Signals partout** | `signal`, `computed`, `input`, `output`, `model` (pas de `@Input/@Output`) |
| **`inject()`** | jamais d'injection par constructeur |
| **Nouvelle syntaxe** | `@if/@for/@switch` (pas `*ngIf/*ngFor`) ; `track` obligatoire |
| **Alias `@app/*`** | importer via `@app/core/...` (configuré dans `tsconfig.json`) |
| **Lazy routes** | `loadComponent: () => import(...)` |

## 2. Conventions de la couche données

- Les composants **n'appellent jamais `HttpClient`** : ils injectent un service `core/`.
- Le **mapping brut → modèle** se fait **dans le service** (méthodes privées `mapXxx`).
- Les **modèles** propres vivent dans `core/models/` ; les **formes brutes GLPI** sont des
  interfaces *privées* dans le service (`GlpiTicketRaw`, `GlpiV2Item`…).
- Les **mappings code↔label, listes d'options, config des assets** : **une seule source**,
  `core/constants/glpi.constants.ts`. Ne duplique jamais un mapping dans un composant.

## 3. Conventions RxJS

- Variables Observable suffixées `$` (`task$`, `obs$`).
- Écritures séquentielles → `concatMap` ; recherche → `switchMap` ; parallèle/attente →
  `forkJoin`.
- Erreurs par ligne isolées avec `catchError` **à l'intérieur** de la boucle.
- Effet de bord (maj signal) → `tap` ; transformation → `map`.

## 4. Conventions CSS / UI

- **Tokens uniquement** (doc 08), jamais de valeur en dur.
- Classes en **BEM léger** (`bloc__element--modif`).
- Réutiliser les composants `shared/ui` ; `OnPush` + fichiers `.html`/`.css` séparés.
- Toute page : `app-page-header`, blocs en `app-card`, états (loading/vide/erreur) gérés.

## 5. Nommage & structure

- Fichiers : `kebab-case` + suffixe de rôle : `*.component.ts`, `*.service.ts`,
  `*.guard.ts`, `*.model.ts`, `*.constants.ts`, `*.utils.ts`.
- Un composant = un dossier (`.ts` + `.html` + `.css`).
- Une feature = un dossier sous `features/<portail>/<feature>/`.
- Services dans `core/services/`, regroupés par domaine (`glpi/`, `import/`).

## 6. TypeScript

- Typage **strict** : pas de `any` gratuit. Pour des structures dynamiques, `Record<string, unknown>`
  puis `String(x ?? '')` au moment de lire.
- Union types exportés pour les variantes (`ButtonVariant`, `ToastVariant`, `ItemType`).
- Préfère `interface` pour les modèles de données.

## 7. Gestion des erreurs (UX)

- Côté service : laisser remonter l'erreur OU la transformer en valeur de repli selon le cas.
- Côté composant : afficher un **message** (`error` signal) ou un **toast**, et sortir de
  l'état `loading`.
- Import : agréger les erreurs **par ligne** (`ImportStats.errors`) plutôt que tout planter.

## 8. Le « definition of done » d'une feature

Une fonctionnalité est terminée quand :
1. La logique d'accès aux données est dans un **service** (`core/`).
2. Les **modèles** sont propres (mapping fait dans le service).
3. Le composant est **OnPush + signals**, charge via `ngOnInit`, gère loading/erreur/vide.
4. L'UI réutilise les composants `shared/ui` et respecte les **tokens**.
5. Les **constantes** (mappings/options) sont centralisées.
6. `npm run build` passe **sans erreur ni warning**.
7. Le comportement est vérifié dans le navigateur (et/ou un test).

## 9. Erreurs fréquentes transverses

| ❌ | ✅ |
|----|----|
| `any` partout | typer, ou `Record<string, unknown>` |
| Dupliquer un mapping | centraliser dans `glpi.constants.ts` |
| Logique métier dans `shared/ui` | la mettre dans un service/feature |
| Valeurs CSS en dur | tokens |
| Composant importé mais inutilisé | le retirer de `imports` (warning NG8113) |
| Oublier de gérer l'état vide/erreur | les prévoir systématiquement |

➡️ Ensuite : **`11-flux-de-donnees.md`**.
