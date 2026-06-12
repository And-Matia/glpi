# 🎓 Bootcamp — Maîtriser le projet GLPI-UI

Bienvenue dans le programme de formation intensif autour de **glpi-ui**, une application
Angular 21 qui sert d'interface moderne (back-office + front-office) au-dessus de
l'API **GLPI 11.0.7**.

À la fin de ce parcours, tu dois être capable de **concevoir et implémenter seul, de bout
en bout, une fonctionnalité complexe en ~2 heures** : comprendre le besoin, concevoir la
solution, l'implémenter (services + `async/await` + composants Angular Material), l'intégrer
dans l'UI, la déboguer et la faire entrer proprement dans l'architecture existante.

---

## 📁 Structure du dossier

```
training/
├── README.md                ← tu es ici (parcours + méthode)
├── docs/                     ← les guides théoriques + exemples du projet
│   ├── 01-vue-densemble.md
│   ├── 02-architecture.md
│   ├── 03-angular-fondamentaux.md
│   ├── 04-rxjs.md
│   ├── 05-couche-donnees-services.md
│   ├── 06-gestion-etat.md
│   ├── 07-composants-ui.md
│   ├── 08-ui-ux-styles.md
│   ├── 09-workflow-import-reset.md
│   ├── 10-conventions-bonnes-pratiques.md
│   ├── 11-flux-de-donnees.md
│   ├── 12-debugging.md
│   ├── 13-recettes-features.md   ← CRUD bout-en-bout (créer élément/user, éditer, supprimer)
│   ├── 14-patterns-examen.md    ← 12 catégories × patterns UI + métier (référence rapide)
│   └── 15-rxjs-pratique.md      ← RxJS pratique : Observables→Promises, arrow functions, opérateurs
├── ui/                       ← Angular Material/CDK + shared/ui de A à Z (API + exemples)
│   ├── README.md
│   ├── 00-material-cdk.md       05-table.md
│   ├── 01-boutons.md            06-overlays.md
│   ├── 02-formulaires.md        07-pagination.md
│   ├── 03-feedback.md           08-recettes.md
│   ├── 04-structure.md          09-kanban.md
│   ├── 10-modales-avancees.md   11-formulaires-avances.md
│   ├── 12-tableaux-avances.md   13-recherche-filtres.md
│   ├── 14-dashboard-widgets.md  15-permissions-auth.md
└── exercises/                ← le parcours pratique, du débutant à l'examen
    ├── README.md
    ├── niveau-1-comprehension.md
    ├── niveau-2-rxjs.md
    ├── niveau-3-modifications.md
    ├── niveau-4-petites-features.md
    ├── niveau-5-features-intermediaires.md
    ├── niveau-6-features-complexes.md
    ├── niveau-7-simulations-examen.md
    └── niveau-8-crud-creation.md   ← création/édition/suppression (toutes les écritures)
```

---

## 🗺️ Parcours recommandé (≈ 5 jours intensifs)

| Jour | Matin | Après-midi |
|------|-------|------------|
| **J1 — Fondations** | docs 01, 02, 03 | Exercices niveau 1 (compréhension) |
| **J2 — RxJS & données** | docs 04, 05 | Exercices niveau 2 (RxJS) |
| **J3 — État & UI** | docs 06, 07, 08 | Exercices niveaux 3 et 4 |
| **J4 — Métier & flux** | docs 09, 11, 10 | Exercice niveau 5 |
| **J5 — CRUD & UI** | doc 13 (recettes) + `ui/00→08` | Exercices niveau 8 (création/édition/suppression) |
| **J6 — Patterns avancés** | `ui/09→15` (kanban, modales, formulaires, tableaux, recherche, dashboard, auth) | Exercices niveaux 5 et 6 |
| **J7 — Examen** | doc 12 (debug) + `docs/14-patterns-examen.md` (référence 12 catégories) | Exercices niveau 7 (simulations chronométrées) |

> 📚 Le dossier **`ui/`** couvre **Angular Material/CDK** (utilisés directement) et **chaque
> composant `shared/ui`** (API exacte + exemples + pièges). Commence par `ui/00-material-cdk.md`.
> La doc **13** est ton aide-mémoire CRUD : créer un élément, étendre la création de ticket,
> créer un utilisateur, éditer, supprimer (tous en `async/await`).
> La doc **14** (`docs/14-patterns-examen.md`) est la référence condensée pour les 36 séries d'examen.
> La doc **15** (`docs/15-rxjs-pratique.md`) couvre RxJS → Promises, arrow functions dans les pipes.

> Tu peux accélérer si tu connais déjà Angular, mais **ne saute pas les docs 05 (services),
> 09 (workflow import) et 13 (recettes CRUD)** : c'est là que se concentre 80 % de la difficulté
> réelle de l'examen. La doc 04 (RxJS) + 15 (RxJS pratique) couvrent les pipelines et patterns async.

---

## ✅ Comment travailler chaque exercice

1. **Lis le contexte métier** et reformule-le avec tes mots.
2. **Conçois** la solution sur papier AVANT de coder (quels fichiers, quelles couches ?).
3. **Implémente** sans regarder la solution.
4. **Vérifie** avec les *critères de validation*.
5. **Compare** avec la solution détaillée et lis les *pièges courants*.
6. Si tu as échoué : recommence l'exercice 24 h plus tard.

### Règle d'or du chronomètre
À partir du niveau 5, **chronomètre-toi**. Objectif examen : une feature intermédiaire en
45 min, une feature complexe en 90–120 min.

---

## 🧰 Commandes essentielles

```bash
npm start          # serveur de dev → http://localhost:4200 (proxy GLPI inclus)
npm run build      # build de production → dist/
npm test           # tests unitaires (Vitest)
ng generate component features/.../nom   # scaffolder un composant
```

> ⚠️ Le serveur de dev a besoin du **proxy** (`proxy.conf.json`) pour parler à GLPI sans
> erreur CORS. C'est déjà câblé dans le script `start`. Voir `docs/12-debugging.md`.

---

## 🎯 Compétences cibles (grille d'auto-évaluation)

Coche quand tu maîtrises **sans aide** :

- [ ] Expliquer les 3 couches (core / features / shared) et où va chaque type de code
- [ ] Créer un composant standalone OnPush avec `signal`, `computed`, `input`, `output`, `model`
- [ ] Lire/écrire un service qui appelle `HttpClient` et **mappe** la donnée brute → modèle propre
- [ ] Choisir le bon opérateur RxJS (`switchMap` vs `concatMap` vs `forkJoin`) et justifier
- [ ] Enchaîner « créer X puis lier Y » de façon séquentielle et gérer les erreurs par ligne
- [ ] Ajouter une route lazy-loaded protégée par un guard
- [ ] Brancher un nouveau type GLPI dans `ASSET_TYPES` sans toucher au reste
- [ ] Diagnostiquer une erreur (CORS, 400 JSON, 206, FK GLPI, itemtype namespacé) et la corriger
- [ ] Construire une page de liste filtrable + une page de détail + un formulaire de création
- [ ] Créer une entité GLPI de bout en bout : résoudre les dropdowns (libellé→id), POST `{ input }`,
      gérer succès/erreur (élément, **utilisateur**, ticket)
- [ ] Éditer (charger→pré-remplir→PUT) et supprimer (ConfirmDialog + `force_purge`) une entité
- [ ] Utiliser Material directement (`mat-flat-button`, `mat-card`, `mat-tab-group`…) et les composants `shared/ui` au bon endroit

Quand toutes les cases sont cochées, tu es prêt. Bon courage 💪
