# 04 — RxJS en profondeur (le cœur de la difficulté)

> 🎯 80 % des bugs et des points d'examen se jouent ici. Lis lentement, code en parallèle.

RxJS modélise des **flux de valeurs dans le temps**. `HttpClient` renvoie des **Observables**.
On les **compose** avec des opérateurs (`map`, `switchMap`, …) puis on s'y **abonne**
(`subscribe`) pour déclencher l'exécution.

---

## 1. Observable : froid, paresseux, et il faut s'abonner

```ts
const obs$ = this.http.get<Ticket[]>(url);   // ❄️ RIEN ne se passe ici
obs$.subscribe(tickets => { … });            // 🔥 MAINTENANT la requête part
```

Points clés :

- **Cold (froid)** : un `HttpClient` ne s'exécute qu'à l'abonnement. Sans `subscribe`
  (ou `firstValueFrom`, ou un `async` pipe), **aucune requête ne part**.
- **Paresseux** : créer l'observable ≠ l'exécuter.
- Chaque `subscribe` **ré-exécute** la requête (re-souscription = nouvel appel HTTP).

> ⚠️ **Piège n°1 absolu :** « j'ai appelé `service.getAll()` mais rien ne se passe » →
> tu as oublié de t'abonner.

Convention de nommage projet : les variables Observable se terminent par `$` (`obs$`, `task$`).

---

## 2. Créer des observables

### `of(value)` — émet une valeur puis complète
```ts
return of(stats);                 // émet `stats` immédiatement
return of([] as number[]);        // utile comme valeur de repli dans catchError
```

### `from(promise | array)` — convertit en observable
```ts
from(this.parseFile(file))        // Promise<ParseResult> → Observable<ParseResult>
from(rows)                        // Array<Row> → émet chaque row une par une
```
> ⚠️ `from(unTableau)` émet **chaque élément séparément** (utile avec `concatMap`).
> `from(unePromise)` émet **la valeur résolue**.

### `throwError(() => err)` — émet une erreur
```ts
return throwError(() => new Error(`Ticket #${num} introuvable`));
```
Utilisé dans `ticket-cost-import.service.ts` pour faire échouer proprement une ligne.

### `defer(() => obs$)` — création **différée** à l'abonnement
```ts
importFile(file): Observable<ImportStats> {
  return defer(() => from(this.run(file)));   // this.run() ne démarre qu'à la souscription
}
```
**Pourquoi c'est crucial ici :** `this.run(file)` est une fonction `async`. Sans `defer`,
écrire `from(this.run(file))` **exécute `run()` immédiatement** (au moment où on construit
l'observable), donc en parallèle des autres étapes. Avec `defer`, `run()` ne part que quand
le `concatMap` arrive à cette étape. *(C'est exactement le bug d'import image qu'on a corrigé.)*

> 🧠 **Règle :** si ton observable enveloppe un effet de bord qui démarre à la création
> (souvent une fonction `async` appelée tout de suite), enveloppe-le dans `defer`.

---

## 3. `map` — transformer chaque valeur

L'équivalent de `Array.map`, mais sur le flux.

```ts
getAll(): Observable<Ticket[]> {
  return this.http.get<GlpiTicketRaw[]>(this.base).pipe(
    map(raws => raws.map(r => this.mapTicket(r)))   // brut GLPI → modèle propre
  );
}
```

> `map` **ne déclenche pas** de nouvel appel asynchrone : c'est une transformation pure.
> Pour enchaîner un AUTRE appel HTTP, il faut un opérateur de **flattening** (`switchMap`,
> `concatMap`…).

---

## 4. Les opérateurs de « flattening » : `switchMap`, `concatMap`, `mergeMap`

Quand, **à partir d'une valeur**, tu veux lancer **un nouvel Observable** (souvent un autre
appel HTTP) et aplatir le résultat. Le choix entre eux est **LA** question d'examen.

| Opérateur | Comportement | Concurrence | Quand l'utiliser |
|-----------|--------------|-------------|------------------|
| `switchMap` | **annule** l'observable précédent si une nouvelle valeur arrive | 1 (le dernier) | recherche/typeahead, « je ne veux que le dernier » |
| `concatMap` | met en **file** : attend que le précédent finisse avant le suivant | 1 (séquentiel, ordre garanti) | écritures séquentielles, dépendances d'ordre |
| `mergeMap` | lance **tout en parallèle** | N | parallélisme sans dépendance d'ordre (rare ici) |

### `switchMap` — enchaîner sans souci d'ordre / annulation
Exemple (`item-import.service.ts`) : parser le fichier PUIS importer les lignes.
```ts
return from(this.parseFile(file)).pipe(
  switchMap(({ rows, errors }) =>            // une fois le fichier parsé…
    this.importRows(rows).pipe(/* … */)      // …lancer l'import des lignes
  )
);
```
Et pour résoudre des dropdowns avant de créer l'élément :
```ts
return forkJoin({ states_id, locations_id, manufacturers_id, model_id }).pipe(
  switchMap(({ states_id, /* … */ }) =>
    this.http.post(`${this.base}/${cfg.itemtype}`, { input: { /* … */ } })
  )
);
```
Ici un seul flux source → `switchMap` se comporte comme « puis ».

### `concatMap` — **séquentiel**, l'ordre compte
C'est le héros de l'import. On importe les lignes **une par une, dans l'ordre** :
```ts
return from(rows).pipe(                       // émet chaque row
  concatMap((row, i) =>                        // attend la fin de la précédente
    this.importRow(row).pipe(
      map(({ id }) => { stats.success++; this.registry.registerItem(row.name, id, row.item_type); return null; }),
      catchError(err => { stats.failed++; stats.errors.push({ row: i + 2, error: … }); return of(null); }),
    )
  ),
  toArray(),                                   // attend que TOUT soit fini
  map(() => stats),
);
```
**Pourquoi `concatMap` et pas `mergeMap` ici ?** Deux raisons :
1. Le **cache de dropdowns** (`GlpiDropdownService`) doit être peuplé par la ligne N avant
   que la ligne N+1 ne le réutilise → sinon on créerait deux fois « Dell ». Le séquentiel
   garantit la cohérence du cache.
2. GLPI assigne des **ids auto-incrémentés** ; faire les choses dans l'ordre rend le flux
   prévisible et évite de marteler le serveur.

Dans `import.component.ts`, on enchaîne les **étapes** (éléments → tickets → coûts → images)
toujours avec `concatMap` :
```ts
from(tasks).pipe(
  concatMap(task$ => task$),   // exécute chaque étape l'une APRÈS l'autre
  toArray(),
).subscribe();
```
> 🧠 Si tu vois « créer A, **puis** lier B qui dépend de A » → `concatMap`.
> Si tu vois « l'utilisateur tape, je veux seulement la dernière recherche » → `switchMap`.

### `switchMap` imbriqué pour « créer puis lier »
`ticket-import.service.ts` : créer le ticket, **puis** lier ses éléments séquentiellement.
```ts
return this.http.post<{ id: number }>(`${this.base}/Ticket`, { input: { … } }).pipe(
  switchMap(({ id: ticketId }) => {
    this.registry.registerTicket(row.ref_ticket, ticketId);     // mémorise la correspondance
    const items = row.items.map(n => this.registry.getItem(n)).filter(Boolean);
    if (!items.length) return of(void 0);
    return from(items).pipe(                                     // lie chaque élément…
      concatMap(item => this.http.post(this.itemTicket, { input: { tickets_id: ticketId, itemtype: item.item_type, items_id: item.id } })
        .pipe(catchError(() => of(void 0)))),                    // une liaison qui rate n'arrête pas tout
      toArray(),
      map(() => void 0),
    );
  })
);
```
Décortique ce bloc : c'est le **patron type** « POST parent → récupérer l'id → POST enfants
en boucle ». Tu le réécriras à l'examen.

---

## 5. `forkJoin` — attendre plusieurs observables **en parallèle**

`forkJoin` lance tout en même temps et émet **une fois** quand **tous** ont complété, sous
forme de tableau OU d'objet.

Forme **objet** (`item-import.service.ts`) — résoudre 4 dropdowns à la fois :
```ts
forkJoin({
  states_id:        this.dropdown.resolve('State', row.status),
  locations_id:     this.dropdown.resolve('Location', row.location),
  manufacturers_id: this.dropdown.resolve('Manufacturer', row.manufacturer),
  model_id:         this.dropdown.resolve(cfg.modelType, row.model),
}).pipe(switchMap(({ states_id, locations_id, … }) => /* crée l'élément */));
```

Forme **tableau** (`item-v1.service.ts`) — charger plusieurs endpoints et fusionner :
```ts
forkJoin(
  ASSET_TYPES.map(cfg =>
    this.http.get<GlpiItemRaw[]>(`${this.base}/${cfg.itemtype}`, { params }).pipe(
      catchError(() => of([] as GlpiItemRaw[])),     // un type vide ne casse pas le tout
      map(raws => raws.map(raw => this.mapItem(raw, cfg))),
    )
  )
).pipe(map(lists => lists.flat()));                  // [[...],[...]] → [...]
```

Forme tableau simple (`dashboard.component.ts`) :
```ts
forkJoin({ tickets: this.ticketService.getAll(), items: this.itemService.getAll() })
  .subscribe({ next: ({ tickets, items }) => { … } });
```

> ⚠️ **Pièges `forkJoin` :**
> 1. Si **un** observable **erreure**, `forkJoin` erreure en entier → d'où les `catchError`
>    par branche pour isoler les échecs.
> 2. Si un observable **ne complète jamais**, `forkJoin` n'émet jamais. `HttpClient`
>    complète après la réponse, donc OK ici.
> 3. `forkJoin` n'émet **rien tant que tout n'est pas fini** (contrairement à `combineLatest`).

---

## 6. `catchError` — gérer l'erreur dans le flux

Intercepte une erreur et **renvoie un nouvel observable** (souvent une valeur de repli).

### Repli silencieux (continuer malgré l'erreur)
```ts
this.http.get<...>(url).pipe(
  catchError(() => of([] as number[]))   // entité vide / 4xx → tableau vide
);
```

### Compter l'erreur par ligne sans arrêter la boucle
```ts
this.importRow(row).pipe(
  map(({ id }) => { stats.success++; return null; }),
  catchError(err => {
    stats.failed++;
    stats.errors.push({ row: i + 2, error: err instanceof Error ? err.message : String(err) });
    return of(null);   // ← on émet une valeur de repli → la boucle continue
  }),
);
```

### Mettre à jour l'UI puis re-propager
```ts
return this.getService(index).importFile(file).pipe(
  tap(stats => this.patchStep(index, { result: stats, status: … })),
  catchError(err => {
    this.patchStep(index, { status: 'error', errorMsg: … });
    return throwError(() => err);   // ← on relance pour signaler l'échec en amont
  }),
);
```

> 🧠 **Décision clé :** dans `catchError`, renvoyer `of(...)` = « j'absorbe, je continue » ;
> renvoyer `throwError(() => err)` = « je remonte l'erreur ». Le choix dépend de si tu veux
> que la suite du flux s'exécute ou non.
>
> ⚠️ **Placement :** un `catchError` placé **à l'intérieur** du `concatMap`/`map` de ligne
> isole l'erreur **à cette ligne**. Placé **à l'extérieur** (sur le flux global), il arrête
> tout le flux. C'est une subtilité d'examen : *où* mettre le `catchError* change le
> comportement.

---

## 7. `tap` — effet de bord sans modifier le flux

`tap` « regarde passer » la valeur (logs, mise à jour d'UI) sans la transformer.
```ts
.pipe(
  tap(stats => this.patchStep(index, { result: stats, status: stats.failed ? 'error' : 'done' })),
)
```
Le flux émet toujours `stats` après le `tap`. Utilise `tap` pour les **side-effects**
(mettre à jour un signal), `map` pour **transformer**.

---

## 8. `toArray` — regrouper toutes les émissions en un tableau

Quand une source émet plusieurs valeurs (ex. `from(rows)` + `concatMap`), `toArray` attend la
**complétion** et émet **un seul** tableau de tout ce qui a été émis.
```ts
from(rows).pipe(
  concatMap(row => this.importRow(row).pipe(/* … */)),
  toArray(),          // attend que toutes les lignes soient traitées
  map(() => stats),   // puis renvoie les statistiques agrégées
);
```
Ici on n'a pas besoin du tableau lui-même : `toArray` sert surtout de **« attends la fin de
toute la boucle »**, puis on renvoie `stats` (accumulé dans les `tap`/`map`).

---

## 9. `firstValueFrom` — passer d'Observable à Promise (`await`)

Quand on est dans une fonction `async` (ex. `image-import.service.ts`), on convertit un
Observable en Promise :
```ts
const res = await firstValueFrom(this.http.post<{ id: number }>(`${this.base}/Document`, form));
```
Et avec un repli :
```ts
const list = await firstValueFrom(
  this.http.get<GlpiNamed[]>(url, { params }).pipe(catchError(() => of([] as GlpiNamed[])))
);
```
> `firstValueFrom` **s'abonne** (donc déclenche la requête), prend la 1re valeur, puis se
> désabonne. C'est le pont RxJS → async/await.
>
> 🧠 **Quand préférer `async/await` (image-import) vs pipe RxJS (autres imports) ?**
> Quand la logique est très **impérative et séquentielle avec des structures de contrôle**
> (boucle `for`, `try/catch`, calculs intermédiaires), `async/await` est plus lisible.
> Quand c'est un **pipeline de transformation**, le `.pipe(...)` RxJS est plus naturel.

---

## 10. `glpi-session.service.ts` — `async/await` + `Promise.all`

```ts
async initAll(): Promise<void> {
  try {
    await Promise.all([ this.initV1Session(), this.initV2Token() ]);  // en parallèle
  } catch (error) {
    console.error('Failed to initialize GLPI session:', error);
  }
}
```
`Promise.all` = le pendant « promesses » de `forkJoin` : attendre plusieurs async en
parallèle.

---

## 11. Tableau de décision (à mémoriser)

```
Je veux…                                                  → opérateur
──────────────────────────────────────────────────────────────────────
transformer une valeur (sync)                              → map
lancer un appel HTTP à partir d'une valeur, ordre important → concatMap
… seulement le dernier (recherche)                         → switchMap
… tous en parallèle (sans ordre)                           → mergeMap
attendre plusieurs appels en parallèle puis combiner       → forkJoin (objet/array)
gérer une erreur (absorber ou relancer)                    → catchError + of/throwError
effet de bord (maj UI, log)                                → tap
émettre une valeur immédiate / repli                       → of
convertir promesse/array en flux                           → from
créer une erreur                                           → throwError(() => e)
différer la création jusqu'à l'abonnement                  → defer
attendre la fin d'une boucle d'émissions                   → toArray
Observable → await                                         → firstValueFrom
```

---

## 12. Pièges récapitulatifs

| ❌ Piège | ✅ Bon réflexe |
|---------|----------------|
| Oublier `subscribe`/`firstValueFrom` → rien ne part | toujours déclencher le flux |
| `mergeMap` là où l'ordre compte | `concatMap` |
| `switchMap` sur des écritures (annulerait la précédente) | `concatMap` pour les POST/PUT |
| `from(promise())` qui exécute trop tôt | `defer(() => from(promise()))` |
| `catchError` mal placé (arrête tout au lieu d'une ligne) | le mettre **dans** le `concatMap` de ligne |
| `forkJoin` qui erreure en entier | `catchError` par branche |
| Muter le résultat d'un `map` | renvoyer une nouvelle valeur |

➡️ Ensuite : **`05-couche-donnees-services.md`** (comment ces flux parlent à GLPI).
