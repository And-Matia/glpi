# Niveau 7 — Simulations d'examen

Conditions réelles : **chronomètre à 2 h**, pas de solution sous les yeux, `npm run build`
doit passer, comportement vérifié dans le navigateur. Chaque simulation = **2 à 3
fonctionnalités** à livrer de bout en bout, comme à l'examen.

> Méthode imposée pendant la simulation :
> 1. **5 min** : lire tout le sujet, planifier l'ordre (quick wins d'abord).
> 2. Pour chaque tâche : concevoir (1 min) → coder → vérifier.
> 3. **10 min** finales : build, tests navigateur, nettoyage des imports inutilisés.

---

## 🧪 Simulation A (2 h) — « Gestion des éléments enrichie »

### Tâche A1 (45 min) — Fiche élément + tickets liés
Depuis la liste store, cliquer sur un élément ouvre `/store/items/:type/:id`. La fiche affiche
tous les champs (statut en badge) **et** la liste des tickets qui référencent cet élément
(titre + statut, cliquables vers la fiche ticket back-office… ou simple affichage).

### Tâche A2 (45 min) — Édition du statut de l'élément
Sur la fiche, un `app-select` permet de changer le **statut** de l'élément et de l'enregistrer
(find-or-create du `State` via `GlpiDropdownService`, puis `ItemV1Service.update`). Toast +
rafraîchissement.

### Tâche A3 (30 min) — Filtre « avec image » sur la liste
Ajouter un filtre booléen « Seulement avec image » sur la liste store : un élément a une image
s'il existe un `Document_Item` pour lui. (Astuce perf : charger une fois la liste des
`Document_Item` et construire un `Set` d'éléments avec image.)

<details><summary>Plan de solution</summary>

- **A1** : route `items/:type/:id`, composant `item-detail` (`ItemV2Service.getById`),
  tickets liés via `GET /Item_Ticket?searchText[items_id]=…&searchText[itemtype]=…` puis
  `forkJoin` de `TicketV1Service.getById`. Liste cliquable :
  `router.navigate(['/store/items', item.item_type, item.id])`.
- **A2** : `dropdown.resolve('State', status).pipe(switchMap(id => itemService.update(this.id,{states_id:id},type)))`,
  toast, reload.
- **A3** : `GET /Document_Item?searchText[itemtype]=…` insuffisant (il faut tous) → charger
  `/Document_Item?range=0-9999`, construire `Set("<itemtype>#<items_id>")`, `computed`
  `filteredItems` ajoute la condition `!onlyWithImage || hasImage(i)`.
</details>

### Grille de notation (/20)
| Critère | Points |
|---------|--------|
| Architecture respectée (services pour l'accès données, pas d'HTTP dans le composant) | 3 |
| RxJS correct (forkJoin/switchMap/concatMap au bon endroit, erreurs gérées) | 4 |
| Signals/computed + OnPush, états loading/erreur/vide | 3 |
| UI : composants `shared/ui`, tokens CSS, badges, page-header/cards | 3 |
| Constantes centralisées, pas de mapping en dur | 2 |
| Les 3 tâches fonctionnent réellement (vérif navigateur) | 3 |
| `npm run build` sans erreur ni warning | 2 |

---

## 🧪 Simulation B (2 h) — « Atelier tickets »

### Tâche B1 (40 min) — Recherche + pagination de la liste des tickets
Ajouter une `app-search-input` (filtre titre) et `app-pagination` (10/page) à la liste des
tickets back-office. Le filtre remet à la page 1.

### Tâche B2 (50 min) — Changer le statut ET la priorité depuis la fiche ticket
Deux `app-select` (statut, priorité) pré-remplis, un bouton « Enregistrer » qui fait un seul
`update(id, { status, priority })`. Toast + reload. Options dérivées de `GLPI_TICKET_STATUS` /
`TICKET_PRIORITY_OPTIONS`.

### Tâche B3 (30 min) — Page « Tickets par priorité »
Nouvelle route back-office `/back-office/tickets-by-priority` : pour chaque priorité, une carte
avec le nombre de tickets (réutiliser `TicketV1Service.getAll` + `computed`). Lien dans la
sidebar.

<details><summary>Plan de solution</summary>

- **B1** : `allRows` (brut) + `rows = computed(filtre + slice page)` ; `effect` ou reset manuel
  de `page` quand `search` change ; `app-pagination [total]="filtered().length"`.
- **B2** : `update(id, { status, priority })` (le service enveloppe en `{input}`), toast,
  `getById` pour recharger.
- **B3** : `computed` qui mappe `GLPI_TICKET_PRIORITY` → `{label, count}` ; UI en `app-card`
  + `app-badge` ; route lazy + lien sidebar.
</details>

### Grille de notation (/20)
| Critère | Points |
|---------|--------|
| Filtre + pagination corrects (page reset, total exact) | 4 |
| Écriture v1 (update) correcte + reload + toast | 4 |
| Nouvelle route lazy + guard + lien sidebar | 2 |
| RxJS & signals propres | 3 |
| UI cohérente (tokens, composants, états) | 3 |
| Constantes réutilisées (pas de mapping dupliqué) | 2 |
| Build OK + vérif navigateur | 2 |

---

## 🧪 Simulation C (2 h) — « Nouveau type de données » (la plus dure)

### Tâche C1 (60 min) — Importer et lister un nouveau type d'asset : `Printer`
1. Ajouter `Printer` à `ASSET_TYPES`.
2. Vérifier/compléter que l'import accepte `Printer` (CSV `Item_Type=Printer`), que la liste
   store l'affiche et que le dashboard le compte.
3. Tester un mini-CSV de 2 imprimantes.

### Tâche C2 (40 min) — Import d'un nouveau fichier : `Locations` (CSV `Name`)
Pré-créer des localisations en masse via un nouveau `LocationImportService` branché comme une
étape supplémentaire de la page d'import (réutiliser `parseCsvText` + `GlpiDropdownService`
ou un POST direct sur `/Location`).

### Tâche C3 (20 min) — Robustesse
Faire en sorte qu'importer les **coûts seuls** après avoir importé les tickets fonctionne
(vérifier le registre persistant) ; et qu'un reset vide bien le registre.

<details><summary>Plan de solution</summary>

- **C1** : une ligne `asset('Printer','Imprimante')` suffit pour l'import (validation +
  `printermodels_id`), la lecture v1/v2 (itèrent sur `ASSET_TYPES`), le filtre store
  (`ASSET_TYPE_OPTIONS`), le dashboard (`itemsByType`) et le reset (`...ASSET_ITEMTYPES`).
  → démontre le pattern Open/Closed.
- **C2** : `LocationImportService.importFile` = `parseFile` (`Name`) + `importRows`
  (`concatMap` → `POST /Location {input:{name}}` ou `dropdown.resolve`), erreurs par ligne.
  Brancher une 5ᵉ étape dans `import.component` (labels/icons/accept/getService/steps).
- **C3** : déjà en place — `ImportRegistryService` persiste en localStorage et n'est pas vidé
  au `startImport` (les ré-imports écrasent par clé) ; `ResetComponent` appelle
  `registry.clearAll()` au succès. Vérifier ces points / les rétablir s'ils ont été cassés.
</details>

### Grille de notation (/20)
| Critère | Points |
|---------|--------|
| C1 : Printer marche partout via la SEULE config (pas de code dupliqué) | 5 |
| C2 : nouvel import complet, branché dans l'UI, erreurs par ligne | 5 |
| C3 : registre persistant + vidé au reset, démonstration du cas « coûts seuls » | 4 |
| RxJS/architecture/UI/constantes propres | 4 |
| Build OK + vérif navigateur (import réel testé) | 2 |

---

## Barème de préparation

- **≥ 16/20** sur 2 simulations différentes, dans le temps → **tu es prêt**.
- **12–15** → revois les docs RxJS (04) et workflow (09), refais le niveau 6.
- **< 12** → reprends les niveaux 3 à 5, puis re-simule.

## Auto-débrief après chaque simulation (à écrire)

1. Qu'est-ce qui m'a pris trop de temps ? (souvent : chercher où va le code → revoir doc 02)
2. Quel bug ai-je eu et comment l'ai-je trouvé ? (revoir doc 12)
3. Ai-je dupliqué quelque chose qui aurait dû être centralisé ?
4. Mon code « ressemble »-t-il au reste du projet ? (conventions doc 10)

Bonne simulation — et bravo d'être allé jusqu'au bout du bootcamp 🎓
