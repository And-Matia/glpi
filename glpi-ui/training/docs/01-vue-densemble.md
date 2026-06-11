# 01 — Vue d'ensemble du projet

## 1. À quoi sert l'application ?

`glpi-ui` est une **interface web moderne** posée par-dessus **GLPI** (un logiciel libre de
gestion de parc informatique et de tickets / ITSM). GLPI expose des API ; notre app les
consomme et offre deux portails :

| Portail | Route racine | Public | Rôle |
|---------|--------------|--------|------|
| **Back-office** | `/back-office` | Administrateur | Tableau de bord, liste & fiche des tickets, **import** de données, **réinitialisation** |
| **Front-office** | `/front-office` | Utilisateur | Liste des éléments du parc (avec recherche), **création de ticket** |

Le back-office est protégé par un **code unique** (pas de login/mot de passe classique :
le code joue le rôle de mot de passe, prérempli sur le formulaire).

## 2. Le besoin métier d'origine (résumé du cahier des charges)

- Back-office protégé, avec :
  - une page pour **réinitialiser** toutes les données GLPI ;
  - une page pour **importer** 4 fichiers : 3 CSV (éléments, tickets, coûts) + 1 ZIP d'images ;
  - un **dashboard** : nombre d'éléments (détail par type) et de tickets (détail par type/statut) ;
  - une **liste des tickets** + une **fiche** ticket.
- Front-office, avec :
  - la **liste des éléments** + recherche multicritère ;
  - la **création d'un ticket** auquel on peut associer plusieurs éléments.
- Contrainte d'intégration : les données importées doivent rester **visibles dans GLPI**,
  et toute modification dans GLPI doit se **répercuter** dans l'app.

> 💡 Comprendre ce besoin est essentiel : à l'examen, les fonctionnalités demandées seront
> des variations autour de ces briques (nouvelle entité à importer, nouveau filtre, nouvelle
> fiche, nouveau champ…).

## 3. La pile technique (stack)

| Domaine | Choix | Version | Pourquoi |
|---------|-------|---------|----------|
| Framework | **Angular** | 21 | Composants standalone, **signals**, nouvelle syntaxe de contrôle `@if/@for` |
| Langage | **TypeScript** | ~5.9 | Typage strict, modèles propres |
| Réactivité | **Angular Signals** + **RxJS** | ~7.8 | Signals pour l'état UI ; RxJS pour les pipelines d'import |
| UI | **Angular Material 21** (M3) | — | Composants thémés (`mat-flat-button`, `mat-card`, etc.) — directs dans les templates |
| HTTP | `@angular/common/http` (`HttpClient`) | — | Appels REST vers GLPI |
| Tests | **Vitest** | 4 | Runner rapide (PAS Karma/Jest) via `@angular/build` |
| Décompression ZIP | **JSZip** | 3.10 | Lire les images du ZIP côté navigateur |
| Icônes | **FontAwesome 6** | CDN | `fa-solid fa-*` dans les templates |
| Styles | **CSS pur + design tokens + thème Material** | — | Variables CSS + `material-theme.scss` |
| Backend | **GLPI** | 11.0.7 | API REST v1 (legacy) + v2 (high-level) + GraphQL + OAuth |

> ⚠️ **Vitest, pas Jest/Karma.** `npm test` lance Vitest via Angular CLI.

## 4. Les API GLPI utilisées (point crucial)

GLPI 11 expose **plusieurs** API en parallèle. Le projet en utilise trois, chacune avec son
mode d'authentification :

| API | URL (relative, via proxy) | Auth | Style | Utilisée pour |
|-----|---------------------------|------|-------|----------------|
| **v1** (legacy, façon `apirest.php`) | `/api.php/v1` | `Session-Token` | endpoints plats `/Computer`, `/Ticket`, `{input:{...}}` | **Écritures** (import, reset, create) + lectures dashboard |
| **v2** (high-level) | `/api.php/v2` | `Bearer` (OAuth) | `/Assets/Computer`, objets imbriqués | **Lectures** front-office (liste des éléments) |
| **token** (OAuth) | `/api.php/token` | — | `password grant` | Obtenir le `access_token` v2 |
| GraphQL | `/api.php/GraphQL` | `Bearer` | requêtes GraphQL | (présent, usage marginal) |

Détails dans `docs/05-couche-donnees-services.md`. Retiens dès maintenant :
**v1 pour écrire, v2 pour lire le parc côté store.**

## 5. Démarrer le projet

```bash
npm install        # (peut nécessiter un certificat de proxy — voir doc 12)
npm start          # http://localhost:4200
```

- Le **proxy de dev** (`proxy.conf.json`) redirige `/api.php`, `/apirest.php`, `/files`
  vers `http://localhost` (le serveur GLPI), ce qui supprime les problèmes de CORS.
- Au démarrage, un **APP_INITIALIZER** (`app.config.ts`) initialise la session GLPI
  (token v1 + token OAuth v2) **avant** que l'app ne s'affiche.

## 6. Carte mentale du dépôt

```
src/
├── index.html              ← inclut FontAwesome (CDN)
├── environment.ts          ← URLs API, tokens, mot de passe back-office
├── styles.css + styles/    ← design tokens (colors.css, variables.css, globals.css)
└── app/
    ├── app.config.ts       ← providers (router, http + interceptor, init session)
    ├── app.routes.ts       ← routes lazy-loaded, guard sur /back-office
    ├── core/               ← cerveau : services, modèles, guards, constants, utils
    ├── features/           ← les pages (back-office / front-office)
    └── shared/             ← briques réutilisables (ui/ + components/)
```

➡️ Continue avec **`02-architecture.md`** pour comprendre *où va chaque type de code*.
