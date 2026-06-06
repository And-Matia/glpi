# 02 — Architecture (Clean Architecture Angular)

## 1. Le principe : 3 couches, une seule direction de dépendance

```
features/  ───dépend de──▶  core/        (services, modèles, logique métier)
   │                          ▲
   └────────dépend de────────┘
                  shared/     (UI réutilisable, sans logique métier)
```

Règles d'or (les retenir = ne jamais se tromper de fichier) :

1. **`features/` ne parle JAMAIS directement à `HttpClient`.** Il injecte un service de `core/`.
2. **`core/` ne connaît PAS les composants.** Il expose des services, modèles, constantes.
3. **`shared/` est « bête »** : des composants de présentation, pilotés par `input()`/`output()`,
   sans appel réseau ni logique métier.
4. La dépendance va toujours **features → core** et **features → shared**. Jamais l'inverse.

> Pourquoi ? Pour que la logique métier soit **testable et réutilisable** indépendamment de
> l'UI, et que l'UI soit réutilisable indépendamment du métier.

## 2. Détail des dossiers

### `core/` — le cerveau

```
core/
├── services/
│   ├── glpi-session.service.ts      ← obtient les tokens (v1 + OAuth v2) au démarrage
│   ├── glpi/
│   │   ├── dropdown.service.ts      ← "find-or-create" des dropdowns GLPI (State, Location…)
│   │   ├── item/   item-v1.service.ts, item-v2.service.ts
│   │   ├── ticket/ ticket-v1.service.ts, ticket-v2.service.ts
│   │   ├── ticket-cost/ ticket-cost-v1.service.ts
│   │   └── graphql/ glpi-graphql.service.ts
│   ├── import/                      ← 1 service par fichier à importer + un registre
│   │   ├── item-import.service.ts
│   │   ├── ticket-import.service.ts
│   │   ├── ticket-cost-import.service.ts
│   │   ├── image-import.service.ts
│   │   └── import-registry.service.ts
│   ├── reset.service.ts
│   ├── auth.service.ts              ← état "connecté ?" du back-office
│   └── toast.service.ts             ← notifications globales
├── guards/        auth.guard.ts     ← protège /back-office
├── interceptors/  glpi-auth.interceptor.ts ← ajoute les headers d'auth à chaque requête
├── models/        item, ticket, ticket-cost, import (interfaces TS propres)
├── constants/     glpi.constants.ts ← SOURCE UNIQUE des mappings & types d'assets
└── utils/         csv.utils.ts      ← parsing CSV générique
```

### `features/` — les pages

Chaque portail a son **layout** (shell) + ses pages sœurs :

```
features/
├── back-office/
│   ├── login/                 (page de code d'accès)
│   ├── layout/                (BackOfficeLayout + Sidebar)
│   ├── dashboard/
│   ├── tickets/ ticket-list/ , ticket-detail/
│   ├── import/
│   └── reset/
└── front-office/
    ├── layout/                (StoreLayout + Navbar)
    ├── items/ item-list/
    └── tickets/ ticket-create/
```

Un composant *feature* = **smart component** : il injecte des services, gère l'état local
(signaux), orchestre, et délègue l'affichage aux composants `shared/ui`.

### `shared/` — les briques

```
shared/
├── ui/         ← composants de présentation (Button, Badge, Input, Table, Modal, Card…)
└── components/ ← composants composites partagés (actuellement vide/minimal)
```

Liste des composants `ui` et leurs `input`/`output` : voir `docs/07-composants-ui.md`
(et le tableau de `CLAUDE.md`).

## 3. Le pattern de la couche données : « Option B »

> **Les services appellent `HttpClient` directement et mappent la forme brute de GLPI vers un
> modèle interne propre, à l'intérieur du service** (méthodes privées `mapXxx`). Il n'y a
> **pas** de couche "repository/serializer" séparée.

Exemple (simplifié de `item-v2.service.ts`) :

```ts
interface GlpiV2Item {                 // forme BRUTE renvoyée par GLPI
  id: number; name: string;
  status: { name: string } | null;
  location: { name: string } | null;
  contact: string | null;
  otherserial: string | null;
}

private mapItem(raw: GlpiV2Item, type: ItemType): Item {   // → modèle PROPRE
  return {
    id: raw.id,
    name: raw.name,
    status: raw.status?.name ?? '',
    location: raw.location?.name ?? '',
    item_type: type,
    inventory_number: raw.otherserial ?? '',
    user: raw.contact ?? raw.user?.name ?? '',
    // ...
  };
}
```

**Pourquoi c'est important :** le reste de l'app ne manipule QUE le modèle `Item` propre.
Si GLPI change sa forme (ou si on passe de v1 à v2), **seul le `mapXxx` du service change**.
C'est le point d'isolation.

## 4. Le découplage v1/v2 derrière un même modèle

`ItemV1Service` et `ItemV2Service` renvoient **tous les deux** des `Item[]` (même modèle),
mais :
- `ItemV1Service` lit `/Computer?expand_dropdowns=1` (les dropdowns deviennent des **strings**) ;
- `ItemV2Service` lit `/Assets/Computer` (les dropdowns sont des **objets** `{id,name}`).

Le composant choisit le service dont il a besoin (dashboard → v1, store → v2) sans savoir
comment la donnée est récupérée. C'est l'**inversion de dépendance** en pratique.

## 5. Le registre d'import (`ImportRegistryService`)

Pièce d'architecture spécifique : un petit service qui mémorise les **correspondances**
créées pendant l'import (nom d'élément → id GLPI, référence CSV de ticket → id GLPI),
**persistées en localStorage**. Il permet de **lier** les données entre fichiers (un coût
référence un ticket, une image référence un élément) même si les imports sont lancés
séparément. Détaillé dans `docs/09-workflow-import-reset.md`.

## 6. Où dois-je écrire mon code ? (arbre de décision)

```
Tu veux…                                          → va dans…
─────────────────────────────────────────────────────────────
appeler une API GLPI / mapper la donnée           → core/services/glpi/...
de la logique d'import                            → core/services/import/...
un mapping code↔label, une liste d'options        → core/constants/glpi.constants.ts
une interface de donnée                           → core/models/...
protéger une route                                → core/guards/...
une page (liste, fiche, formulaire)               → features/<portail>/<feature>/...
un bouton/badge/champ réutilisable générique      → shared/ui/...
un helper pur (parsing, format)                   → core/utils/...
```

## 7. Erreurs fréquentes

| ❌ Erreur | ✅ Correctif |
|-----------|-------------|
| Appeler `HttpClient` dans un composant | Créer/utiliser un service `core/` |
| Dupliquer un mapping code→label dans un composant | Centraliser dans `glpi.constants.ts` |
| Mettre de la logique métier dans un composant `shared/ui` | Garder `shared/ui` purement présentationnel |
| Importer un composant `feature` depuis `core` | Interdit : `core` ne dépend pas de l'UI |
| Re-mapper la forme GLPI dans le composant | Le mapping appartient au service |

➡️ Ensuite : **`03-angular-fondamentaux.md`**.
