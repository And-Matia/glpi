# 04 — RxJS en profondeur (pipelines d'import)

> 🎯 Ce guide couvre RxJS tel qu'il est utilisé dans ce projet : **exclusivement dans les
> services d'import** (`core/services/import/`). Les composants de feature (pages) consomment
> les services via `firstValueFrom()` + `async/await` — pas de `.subscribe()` là-bas.
>
> Lis ce guide pour comprendre l'import. Pour les patterns CRUD des pages, voir `13-recettes-features.md`.

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
    // apiType (endpoint REST réel) + encodeURIComponent (itemtypes namespacés : "Glpi\Socket")
    this.http.post(`${this.base}/${encodeURIComponent(cfg.apiType)}`, { input: { /* … */ } })
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
      map(() => { stats.success++; return null; }),
      catchError(err => { stats.failed++; stats.errors.push({ row: i + 2, error: this.errorText(err) }); return of(null); }),
    )
  ),
  toArray(),                                   // attend que TOUT soit fini
  map(() => stats),
);
```
**Pourquoi `concatMap` et pas `mergeMap` ici ?** Deux raisons :
1. Le **cache de dropdowns** (`GlpiDropdownService`) doit être peuplé par la ligne N avant
   que la ligne N+1 ne le réutilise → sinon on créerait deux fois « Dell ». Le séquentiel
   garantit la cohérence du cache. *(Le `concatMap` documente lui-même cette dépendance :
   un futur lecteur comprend que l'ordre est volontaire.)*
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
`ticket-import.service.ts` : créer le ticket (avec sa réf. dans `externalid`), **puis** lier ses
éléments séquentiellement. La correspondance nom→élément est résolue **côté GLPI** (plus de
registre local), via `GlpiImportLookupService.findItemByName`.
```ts
return this.http.post<{ id: number }>(`${this.base}/Ticket`, {
  input: { name: row.titre, content: row.description, /* … */ externalid: row.ref_ticket },
}).pipe(
  switchMap(({ id: ticketId }) => {
    if (!row.items.length) return of(void 0);
    return from(row.items).pipe(                                 // pour chaque nom d'élément…
      concatMap(name =>
        this.lookup.findItemByName(name).pipe(                   // …le retrouver dans GLPI…
          concatMap(found =>
            found
              ? this.http.post<void>(this.itemTicket, {          // …puis créer la relation.
                  // apiTypeOf : le type namespacé attendu côté GLPI (Socket → "Glpi\Socket")
                  input: { tickets_id: ticketId, itemtype: apiTypeOf(found.type), items_id: found.id },
                }).pipe(catchError(() => of(void 0)))            // une liaison qui rate n'arrête pas tout
              : of(void 0),
          ),
        ),
      ),
      toArray(),
      map(() => void 0),
    );
  }),
);
```
Décortique ce bloc : c'est le **patron type** « POST parent → récupérer l'id → (résoudre +) POST
enfants en boucle ». Tu le réécriras à l'examen. Note le **double `concatMap`** : un pour
sérialiser les noms, un pour enchaîner « résoudre → lier » à l'intérieur.

---

## 5. `forkJoin` — attendre plusieurs observables **en parallèle**

`forkJoin` lance tout en même temps et émet **une fois** quand **tous** ont complété, sous
forme de tableau OU d'objet.

Forme **objet** (`item-import.service.ts`) — résoudre les dropdowns à la fois. Le modèle n'est
résolu que si le type en possède un (`cfg.modelType`), sinon `of(0)` (sinon on requêterait un
endpoint inexistant) :
```ts
forkJoin({
  states_id:        this.dropdown.resolve('State', row.status),
  locations_id:     this.dropdown.resolve('Location', row.location),
  manufacturers_id: this.dropdown.resolve('Manufacturer', row.manufacturer),
  model_id:         cfg.modelType ? this.dropdown.resolve(cfg.modelType, row.model) : of(0),
}).pipe(switchMap(({ states_id, locations_id, … }) => /* crée l'élément */));
```

Forme **tableau** (`item-v1.service.ts`) — charger plusieurs endpoints et fusionner :
```ts
forkJoin(
  ASSET_TYPES.map(cfg =>
    this.http.get<GlpiItemRaw[]>(`${this.base}/${encodeURIComponent(cfg.apiType)}`, { params }).pipe(
      catchError(() => of([] as GlpiItemRaw[])),     // un type vide / en erreur ne casse pas le tout
      map(raws => raws.map(raw => this.mapItem(raw, cfg))),
    )
  )
).pipe(map(lists => lists.flat()));                  // [[...],[...]] → [...]
```

Forme tableau simple (`super-cost.component.ts`) :
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

## 11. `first` / `take` / `filter` — réduire le flux

### `first(predicate?, default?)` — la **1re** valeur (qui matche), puis complète
Utilisé dans `glpi-import-lookup.service.ts` pour **court-circuiter** une recherche multi-types :
on essaie chaque itemtype en séquence et on **s'arrête au premier** qui trouve l'élément.
```ts
return from(ASSET_TYPES).pipe(
  concatMap(cfg => this.searchOne(cfg, name)),   // émet {id,type} | null pour chaque type
  first((r): r is Found => r !== null, null),    // 1er résultat non-null → complète (stoppe le reste)
);
```
- `first()` sans argument = la 1re valeur émise.
- `first(pred)` = la 1re qui satisfait `pred` (sinon **erreur** si rien ne matche).
- `first(pred, default)` = comme ci-dessus mais émet `default` au lieu d'erreurer. **Toujours
  fournir un `default`** si « rien trouvé » est un cas normal.
- Comme `first` **complète** après la 1re valeur, le `concatMap` en amont **arrête** d'émettre →
  on n'interroge pas les types suivants inutilement (court-circuit).

> `take(n)` = les `n` premières valeurs puis complète. `take(1)` ≈ `first()` (mais `take(1)`
> n'erreure jamais si la source complète à vide ; `first()` si). `last()` = la dernière.

### `filter(pred)` — ne laisse passer que ce qui matche
```ts
this.search$.pipe(filter(term => term.length >= 2), …)   // ignore les recherches trop courtes
```

---

## 12. Recherche réactive : `debounceTime` + `distinctUntilChanged` + `switchMap`

Le patron **typeahead** de référence (à connaître pour l'examen, même si le projet filtre
souvent côté client avec un `computed`).
```ts
this.term$.pipe(
  debounceTime(300),                 // attendre 300 ms d'inactivité (ne pas requêter à chaque frappe)
  distinctUntilChanged(),            // ignorer si le texte n'a pas changé
  switchMap(term =>                  // annuler la requête précédente (seul le dernier compte)
    this.api.search(term).pipe(catchError(() => of([]))),
  ),
).subscribe(results => this.results.set(results));
```
- `debounceTime(ms)` : n'émet qu'après un silence de `ms` → réduit drastiquement les appels.
- `distinctUntilChanged()` : évite de re-requêter une valeur identique.
- `switchMap` : **annule** la requête en vol si l'utilisateur retape → pas de résultats périmés.
> 🧠 Le trio `debounceTime → distinctUntilChanged → switchMap` est *la* signature d'une bonne
> recherche serveur. Avec une recherche **purement locale**, préfère un `computed` sur un signal
> (voir `06-gestion-etat.md`).

---

## 13. `finalize` — exécuter quoi qu'il arrive (succès **ou** erreur)

Idéal pour **éteindre un état `loading`** sans le dupliquer dans `next` ET `error`.
```ts
this.loading.set(true);
this.service.getAll().pipe(
  finalize(() => this.loading.set(false)),   // appelé à la complétion OU à l'erreur OU au désabonnement
).subscribe({
  next:  data => this.rows.set(data),
  error: ()   => this.error.set('Échec du chargement.'),
});
```
> Sans `finalize`, tu dois remettre `loading=false` dans `next` **et** dans `error` (oubli
> fréquent → spinner bloqué). `finalize` centralise.

---

## 14. `exhaustMap` — ignorer pendant qu'un travail est en cours (anti double-clic)

`exhaustMap` lance l'observable interne et **ignore les nouvelles émissions tant qu'il n'a pas
fini**. Parfait pour un **bouton de soumission** : un double-clic ne crée pas deux tickets.
```ts
this.submitClicks$.pipe(
  exhaustMap(() => this.ticketService.create(input)),   // les clics pendant le POST sont ignorés
).subscribe(() => this.toast.success('Créé.'));
```
| Cas d'usage | Opérateur |
|-------------|-----------|
| Recherche (garder le dernier) | `switchMap` |
| Écritures ordonnées (tout exécuter, en file) | `concatMap` |
| Soumission (ignorer les rejeux pendant le travail) | `exhaustMap` |
| Parallèle sans ordre | `mergeMap` |

> Dans le projet on bloque souvent le double-clic via le signal `submitting` + `[disabled]`.
> `exhaustMap` est l'équivalent côté flux (utile si tu pars d'un `Subject` de clics).

---

## 15. `retry` & `timeout` — robustesse réseau

```ts
this.http.get<X[]>(url).pipe(
  timeout(8000),                          // erreur si pas de réponse en 8 s
  retry({ count: 2, delay: 1000 }),       // réessaye 2× à 1 s d'intervalle avant d'abandonner
  catchError(() => of([])),               // repli final
);
```
> `retry` **re-souscrit** à la source (relance l'appel HTTP). Ne l'utilise pas sur des écritures
> **non idempotentes** (un POST de création réessayé peut créer un doublon).

---

## 16. `combineLatest` vs `forkJoin`

Les deux combinent plusieurs sources, mais :
| | `forkJoin` | `combineLatest` |
|--|-----------|-----------------|
| Émet | **une fois**, à la complétion de **toutes** | **à chaque** émission de **l'une**, dès que toutes ont émis ≥ 1× |
| Pour | requêtes HTTP (qui complètent) | flux **persistants** (signaux-like, filtres combinés) |

```ts
// Réagir à 2 filtres qui changent dans le temps (sources qui n'achèvent pas) :
combineLatest([this.type$, this.status$]).pipe(
  map(([type, status]) => this.applyFilters(type, status)),
);
```
> ⚠️ Avec des `HttpClient` (qui complètent), `combineLatest` finit par se comporter comme
> `forkJoin` mais émet aussi les états intermédiaires → pour « attendre tout », c'est `forkJoin`.
> Dans ce projet, les états combinés se font surtout via **`computed`** sur des signals.

---

## 17. `reduce` / `scan` — agréger des émissions

- `reduce` : comme `Array.reduce`, émet **un seul** résultat à la complétion.
- `scan` : émet le **cumul à chaque** étape (utile pour une progression).
```ts
from(rows).pipe(
  concatMap(row => this.save(row).pipe(map(() => 1), catchError(() => of(0)))),
  scan((done, ok) => done + ok, 0),     // émet 1, 2, 3, … (progression en direct)
  tap(done => this.progress.set(done)),
).subscribe();
```
> Dans l'import, on accumule plutôt dans un objet `stats` muté + `toArray()`. `reduce`/`scan`
> sont l'alternative « pure flux » à connaître.

---

## 18. `Subject` / `BehaviorSubject` — et pourquoi le projet préfère les **signals**

Un `Subject` est un Observable **dont tu pousses** les valeurs (`.next(v)`) — utile pour
transformer un événement impératif (clic) en flux.
```ts
private readonly clicks$ = new Subject<void>();
onClick() { this.clicks$.next(); }            // pousser
ngOnInit() { this.clicks$.pipe(exhaustMap(() => this.save())).subscribe(); }
```
`BehaviorSubject<T>(initial)` garde la **dernière** valeur et la rejoue aux nouveaux abonnés —
c'était l'outil d'état avant les signals.

> 🧠 **Dans ce projet, l'état se gère avec `signal`/`computed`**, pas des Subjects (voir
> `06-gestion-etat.md`). Garde les Subjects pour **transformer un flux d'événements** quand tu as
> besoin d'opérateurs temporels (`debounceTime`, `exhaustMap`). Pour stocker une valeur : signal.

---

## 19. Cycle de vie & fuites : `async` pipe, `takeUntilDestroyed`, `take(1)`

Un `subscribe` manuel **vit jusqu'à** la complétion ou le désabonnement. `HttpClient` complète
tout seul (1 réponse) → pas de fuite. Mais un flux **qui ne complète pas** (Subject,
`interval`, `combineLatest` de signaux) **fuit** si tu ne te désabonnes pas.

Trois bons réflexes :
```ts
// a) Le pipe `async` du template : Angular gère l'abonnement ET le désabonnement tout seul.
items$ = this.service.getAll();
// template : @if (items$ | async; as items) { … }

// b) takeUntilDestroyed() : coupe le flux quand le composant est détruit.
this.clicks$.pipe(takeUntilDestroyed(), exhaustMap(() => this.save())).subscribe();

// c) take(1) / first() : pour un one-shot, le flux se ferme après la 1re valeur.
this.service.getById(id).pipe(take(1)).subscribe(x => this.x.set(x));
```
> Règle simple : **HTTP one-shot** → `subscribe` direct OK (il complète). **Flux persistant** →
> `async` pipe **ou** `takeUntilDestroyed`. Ne laisse jamais un Subject/`interval` sans garde.

---

## 20. Comment **lire** un `.pipe()` (méthode anti-panique)

1. **Pars du `subscribe`** (ou `async`) : c'est là que tout démarre.
2. **Remonte la source** : `from(rows)` (N émissions ?) `http.get` (1 émission) `of(x)` (1) ?
3. **Pour chaque opérateur, demande** : « est-ce que je **transforme** (`map`), **enchaîne un
   appel** (`*Map`), **attends plusieurs** (`forkJoin`), **gère l'erreur** (`catchError`), ou
   **fais un effet de bord** (`tap`) ? »
4. **Repère le `*Map`** : c'est le cœur. `switch`/`concat`/`merge`/`exhaust` → relis le tableau §14.
5. **Trouve les `catchError`** : *à l'intérieur* d'un `concatMap` = erreur isolée par ligne ;
   *à l'extérieur* = stoppe tout.

### Mini-marbles (source émet `a` puis `b`, requête = `R(x)` qui prend du temps)
```
source:      --a-----b------|
switchMap:   ----R(a)X-R(b)--|     (R(a) annulé quand b arrive)
concatMap:   ----R(a)----R(b)|     (R(b) attend la fin de R(a))
mergeMap:    ----R(a)--R(b)--|     (en parallèle, ordre d'arrivée non garanti)
exhaustMap:  ----R(a)-------|      (b ignoré car R(a) en cours)
```

---

## 21. Tableau de décision (à mémoriser)

```
Je veux…                                                  → opérateur
──────────────────────────────────────────────────────────────────────
transformer une valeur (sync)                              → map
lancer un appel HTTP à partir d'une valeur, ordre important → concatMap
… seulement le dernier (recherche)                         → switchMap
… ignorer les rejeux pendant le travail (submit)           → exhaustMap
… tous en parallèle (sans ordre)                           → mergeMap
attendre plusieurs appels en parallèle puis combiner       → forkJoin (objet/array)
réagir à plusieurs flux persistants qui changent           → combineLatest
gérer une erreur (absorber ou relancer)                    → catchError + of/throwError
réessayer un appel qui échoue (lecture idempotente)        → retry({count,delay})
abandonner si trop lent                                    → timeout(ms)
exécuter quoi qu'il arrive (éteindre un loading)           → finalize
effet de bord (maj UI, log)                                → tap
ne garder que ce qui matche                                → filter
la 1re valeur (qui matche) puis stop / court-circuit       → first(pred?, default?) / take(1)
la dernière valeur                                         → last()
ignorer les frappes trop rapprochées (recherche)           → debounceTime + distinctUntilChanged
agréger en un seul résultat / en progression               → reduce / scan
émettre une valeur immédiate / repli                       → of   (rien du tout → EMPTY)
choisir un observable selon une condition                  → iif(() => cond, a$, b$)
convertir promesse/array en flux                           → from
créer une erreur                                           → throwError(() => e)
différer la création jusqu'à l'abonnement                  → defer
attendre la fin d'une boucle d'émissions                   → toArray
Observable → await                                         → firstValueFrom
pousser des valeurs manuellement (événements)              → Subject / BehaviorSubject
couper un flux persistant à la destruction du composant    → takeUntilDestroyed
```

---

## 22. Pièges récapitulatifs

| ❌ Piège | ✅ Bon réflexe |
|---------|----------------|
| Oublier `subscribe`/`firstValueFrom` → rien ne part | toujours déclencher le flux |
| `mergeMap` là où l'ordre compte | `concatMap` |
| `switchMap` sur des écritures (annulerait la précédente) | `concatMap` pour les POST/PUT |
| Double-clic qui crée 2 entités | `exhaustMap` (ou `submitting` + `[disabled]`) |
| `from(promise())` qui exécute trop tôt | `defer(() => from(promise()))` |
| `catchError` mal placé (arrête tout au lieu d'une ligne) | le mettre **dans** le `concatMap` de ligne |
| `forkJoin` qui erreure en entier | `catchError` par branche |
| `forkJoin` qui n'émet jamais | une source ne complète pas → utilise `combineLatest` ou `take(1)` |
| `first(pred)` sans `default` qui erreure « no elements » | `first(pred, valeurParDéfaut)` |
| `loading` jamais remis à `false` sur erreur | `finalize(() => loading.set(false))` |
| `retry` sur un POST → doublons | ne réessayer que les **lectures** idempotentes |
| Recherche serveur qui spamme l'API | `debounceTime` + `distinctUntilChanged` + `switchMap` |
| Subject/`interval` sans désabonnement → fuite | `async` pipe, `takeUntilDestroyed`, ou `take(1)` |
| Muter le résultat d'un `map` | renvoyer une nouvelle valeur |

➡️ Ensuite : **`05-couche-donnees-services.md`** (comment ces flux parlent à GLPI).
