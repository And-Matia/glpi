# 🎓 Bootcamp — Maîtriser le projet GLPI-UI

Bienvenue dans le programme de formation intensif autour de **glpi-ui**, une application
Angular 21 qui sert d'interface moderne (back-office + front-office) au-dessus de
l'API **GLPI 11.0.7**.

À la fin de ce parcours, tu dois être capable de **concevoir et implémenter seul, de bout
en bout, une fonctionnalité complexe en ~2 heures** : comprendre le besoin, concevoir la
solution, l'implémenter (services + RxJS + composants), l'intégrer dans l'UI, la déboguer
et la faire entrer proprement dans l'architecture existante.

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
│   └── 12-debugging.md
└── exercises/                ← le parcours pratique, du débutant à l'examen
    ├── README.md
    ├── niveau-1-comprehension.md
    ├── niveau-2-rxjs.md
    ├── niveau-3-modifications.md
    ├── niveau-4-petites-features.md
    ├── niveau-5-features-intermediaires.md
    ├── niveau-6-features-complexes.md
    └── niveau-7-simulations-examen.md
```

---

## 🗺️ Parcours recommandé (≈ 5 jours intensifs)

| Jour | Matin | Après-midi |
|------|-------|------------|
| **J1 — Fondations** | docs 01, 02, 03 | Exercices niveau 1 (compréhension) |
| **J2 — RxJS & données** | docs 04, 05 | Exercices niveau 2 (RxJS) |
| **J3 — État & UI** | docs 06, 07, 08 | Exercices niveaux 3 et 4 |
| **J4 — Métier & flux** | docs 09, 11, 10 | Exercice niveau 5 |
| **J5 — Examen** | doc 12 (debug) + relecture | Exercices niveaux 6 et 7 (simulations chronométrées) |

> Tu peux accélérer si tu connais déjà Angular, mais **ne saute pas les docs 04 (RxJS),
> 05 (services) et 09 (workflow import)** : c'est là que se concentre 80 % de la difficulté
> réelle de l'examen.

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
- [ ] Diagnostiquer une erreur (CORS, 400 JSON, 206, FK GLPI) et la corriger
- [ ] Construire une page de liste filtrable + une page de détail + un formulaire de création

Quand les 9 cases sont cochées, tu es prêt. Bon courage 💪
