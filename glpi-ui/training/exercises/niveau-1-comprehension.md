# Niveau 1 — Compréhension du code existant

But : savoir **lire**, **localiser** et **tracer** le code avant d'y toucher. Réponds par
écrit (chemins de fichiers, numéros de ligne, schémas). Vérifie ensuite dans le code.

---

## Exercice 1.1 — Cartographie des couches

**Contexte.** Tu arrives sur le projet ; tu dois savoir où vit chaque type de code.

**Objectifs.** Pour chacun des éléments suivants, donne le **dossier** et un **fichier exemple** :
1. un service qui appelle l'API GLPI ;
2. un mapping `code statut ticket → libellé` ;
3. une interface de modèle métier ;
4. un composant de présentation réutilisable ;
5. la protection des routes back-office ;
6. un helper de parsing.

**Compétences évaluées.** Connaissance de l'architecture (doc 02).

<details><summary>Solution</summary>

1. `core/services/glpi/...` → ex. `item-v1.service.ts`
2. `core/constants/glpi.constants.ts` → `GLPI_TICKET_STATUS`
3. `core/models/...` → `item.model.ts` (`Item`)
4. `shared/ui/...` → `button/button.component.ts`
5. `core/guards/auth.guard.ts`
6. `core/utils/csv.utils.ts`
</details>

**Validation.** 6/6 sans hésiter.

---

## Exercice 1.2 — Tracer le dashboard

**Contexte.** Le dashboard affiche un nombre d'éléments par type.

**Objectifs.** Décris le flux **complet** : du `ngOnInit` jusqu'au libellé affiché. Cite la
ou les méthodes de service, l'endpoint GLPI, le mapping, le(s) signal(aux) et le `computed`.

**Fichiers.** `super-cost.component.ts`, `item-v1.service.ts`, `glpi.constants.ts`.

**Compétences.** Lecture de flux (doc 11), signals/computed (doc 03/06).

<details><summary>Solution</summary>

`ngOnInit` → `forkJoin({tickets: ticketService.getAll(), items: itemService.getAll()})`.
`ItemV1Service.getAll()` fait un `forkJoin` sur `ASSET_TYPES` → `GET /api.php/v1/<type>?expand_dropdowns=1`,
`catchError(()=>of([]))`, `map(mapItem)`, puis `.flat()`. Le `.subscribe` fait `items.set(data)` +
`loading.set(false)`. Le `computed itemsByType()` parcourt `ASSET_TYPES` et compte
`items().filter(i => i.item_type === cfg.itemtype)`, filtre les `count>0`. Le template
fait `@for (e of itemsByType())` → `<app-badge>{{ e.count }}</app-badge>`.
</details>

**Validation.** Ton schéma cite : service → endpoint → mapping → signal → computed → template.

---

## Exercice 1.3 — Pourquoi deux services Item (v1 et v2) ?

**Objectifs.** Explique : (a) la différence de forme des données renvoyées par v1 et v2 ;
(b) pourquoi les deux renvoient quand même `Item[]` ; (c) qui utilise lequel et pourquoi.

**Fichiers.** `item-v1.service.ts`, `item-v2.service.ts`, `super-cost.component.ts`,
`item-list.component.ts`.

<details><summary>Solution</summary>

(a) v1 (`expand_dropdowns=1`) renvoie les dropdowns en **strings** (`states_id:"En production"`) ;
v2 (`/Assets/...`) renvoie des **objets** (`status:{name}`). (b) Chaque service a son propre
`mapItem` qui produit le **même modèle `Item`** → isolation par le mapping (doc 02). (c) Le
**dashboard** (back-office) utilise v1 ; la **liste store** (front-office) utilise v2. Choix
du service selon le besoin, sans que le composant connaisse la forme brute.
</details>

**Validation.** Tu emploies le mot « mapping/isolation » et tu cites qui utilise quoi.

---

## Exercice 1.4 — Lire un pipe RxJS

**Contexte.** Extrait de `ticket-import.service.ts` (création + liaison).

**Objectifs.** Pour le bloc ci-dessous, annote **chaque opérateur** : que fait-il, pourquoi
celui-ci ?

```ts
this.http.post<{id:number}>(`${this.base}/Ticket`, { input: {...} }).pipe(
  switchMap(({ id: ticketId }) => {
    this.registry.registerTicket(row.ref_ticket, ticketId);
    const items = row.items.map(n => this.registry.getItem(n)).filter(Boolean);
    if (!items.length) return of(void 0);
    return from(items).pipe(
      concatMap(item => this.http.post(this.itemTicket, { input: {...} }).pipe(catchError(() => of(void 0)))),
      toArray(), map(() => void 0),
    );
  })
);
```

<details><summary>Solution</summary>

- `post(...)` : crée le ticket, émet `{id}`.
- `switchMap` : à partir de l'id, enchaîne le sous-flux de liaison (ici « puis »).
- `registerTicket` : mémorise réf CSV → id GLPI (effet de bord).
- `from(items)` : émet chaque élément à lier.
- `concatMap` : lie **séquentiellement** (un POST `Item_Ticket` après l'autre).
- `catchError(()=>of(void 0))` (interne) : une liaison ratée n'arrête pas les autres.
- `toArray()` : attend que toutes les liaisons soient finies.
- `map(()=>void 0)` : normalise la sortie.
- `of(void 0)` : cas « aucun élément à lier ».
</details>

**Validation.** Annotation correcte des 8 opérateurs.

---

## Exercice 1.5 — Où ajouter un type d'asset ?

**Objectifs.** Sans coder : explique **toutes** les conséquences d'ajouter
`asset('Printer','Imprimante')` à `ASSET_TYPES`. Qu'est-ce qui marche « gratuitement » ?

<details><summary>Solution</summary>

`ASSET_ITEMTYPES` inclut « Printer » → l'import accepte ce type (validation CSV) et déduit
`PrinterModel`/`printermodels_id`. `ItemV1Service.getAll` et `ItemV2Service.getAll` itèrent
sur `ASSET_TYPES` → lisent aussi les imprimantes. `ASSET_TYPE_OPTIONS` ajoute « Imprimante »
au filtre de la liste store. `dashboard.itemsByType()` compte les imprimantes. `ResetService`
purge aussi `/Printer`. **Tout** en découle car la config est centralisée (pattern
Open/Closed).
</details>

**Validation.** Tu cites au moins : import, lecture v1/v2, filtre store, dashboard, reset.

---

## Exercice 1.6 — Le rôle du registre

**Objectifs.** Explique en 5 lignes : à quoi sert `ImportRegistryService`, pourquoi il
persiste en localStorage, et quand il est vidé.

<details><summary>Solution</summary>

Il mappe `nom élément → {id,type}` et `réf CSV ticket → id GLPI`. Il permet de **lier** les
données entre fichiers (tickets↔éléments, coûts→ticket, images→élément). Persisté en
localStorage pour que des imports **séparés** (ex. coûts seuls) retrouvent les ids créés
précédemment. Vidé lors d'un **reset** (sinon il pointerait vers des ids supprimés).
</details>

**Validation.** Tu mentionnes « lier entre fichiers », « imports séparés », « vidé au reset ».
