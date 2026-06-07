# Niveau 2 — RxJS ciblé

Entraînement intensif aux opérateurs. Écris le code dans un fichier de brouillon (ou des
tests), raisonne sur le comportement. Réfère-toi à `docs/04-rxjs.md`.

---

## Exercice 2.1 — Choisir l'opérateur

**Objectifs.** Pour chaque situation, donne l'opérateur et **justifie** :
1. Un champ de recherche : à chaque frappe, requêter l'API et n'afficher que le dernier résultat.
2. Importer 50 lignes CSV **dans l'ordre**, chacune dépend d'un cache rempli par la précédente.
3. Charger en parallèle la liste des tickets ET des éléments, puis afficher quand tout est prêt.
4. Créer un ticket, puis lier 3 éléments l'un après l'autre.
5. Logger la réponse sans la modifier.

<details><summary>Solution</summary>

1. `switchMap` (annule la requête précédente). 2. `concatMap` (séquentiel, cache cohérent).
3. `forkJoin` (attend tout, en parallèle). 4. `concatMap` imbriqué (besoin de l'id du ticket).
5. `tap`.
</details>

**Validation.** 5/5 avec justification.

---

## Exercice 2.2 — `switchMap` vs `concatMap` vs `mergeMap`

**Contexte.** On émet `[1,2,3]` et pour chaque valeur on appelle une « requête » qui met
`n*100 ms` à répondre puis renvoie `n`.

**Objectifs.** Donne l'**ordre et le contenu** des valeurs reçues avec :
(a) `concatMap`, (b) `mergeMap`, (c) `switchMap` — quand la source émet 1, 2, 3 **quasi
instantanément**.

<details><summary>Solution</summary>

- `concatMap` : `1, 2, 3` (attend chaque requête; ordre garanti).
- `mergeMap` : `1, 2, 3` mais l'**ordre d'arrivée** dépend des délais (ici 1 arrive avant 2
  avant 3 car délais croissants, mais en général non garanti).
- `switchMap` : **seulement `3`** (les requêtes 1 et 2 sont annulées dès que 2 puis 3 arrivent).
</details>

**Validation.** Tu comprends que `switchMap` **annule** et que `concatMap` **sérialise**.

---

## Exercice 2.3 — Réécrire en RxJS

**Contexte.** Voici une version impérative (async/await). Réécris-la **en pipe RxJS** qui
renvoie un `Observable<{id:number}>`.

```ts
async createWithItems(input, items) {
  const { id } = await firstValueFrom(this.http.post('/Ticket', { input }));
  for (const it of items) {
    await firstValueFrom(this.http.post('/Item_Ticket', { input: { tickets_id: id, itemtype: it.type, items_id: it.id } }));
  }
  return { id };
}
```

<details><summary>Solution</summary>

```ts
createWithItems(input, items: {type:string;id:number}[]): Observable<{id:number}> {
  return this.http.post<{id:number}>('/Ticket', { input }).pipe(
    switchMap(({ id }) =>
      (items.length ? from(items).pipe(
        concatMap(it => this.http.post('/Item_Ticket', { input: { tickets_id: id, itemtype: it.type, items_id: it.id } })),
        toArray(),
      ) : of(null)).pipe(map(() => ({ id })))
    )
  );
}
```
</details>

**Validation.** `concatMap` pour les liaisons, l'`id` est bien propagé en sortie.

---

## Exercice 2.4 — Gestion d'erreur par ligne

**Objectifs.** Écris un flux qui, à partir d'un `rows: Row[]`, appelle `this.save(row)`
(Observable) pour chacune **en séquence**, compte `success`/`failed`, collecte les erreurs
`{row, error}`, **sans jamais s'arrêter**, et renvoie `Observable<Stats>`.

<details><summary>Solution</summary>

```ts
const stats: Stats = { total: rows.length, success: 0, failed: 0, errors: [] };
return from(rows).pipe(
  concatMap((row, i) => this.save(row).pipe(
    map(() => { stats.success++; return null; }),
    catchError(err => { stats.failed++; stats.errors.push({ row: i + 1, error: err instanceof Error ? err.message : String(err) }); return of(null); }),
  )),
  toArray(),
  map(() => stats),
);
```
</details>

**Validation.** `catchError` **à l'intérieur** du `concatMap` (sinon une erreur stoppe tout).

---

## Exercice 2.5 — `forkJoin` objet + repli par branche

**Objectifs.** Charge en parallèle 3 endpoints (`A`, `B`, `C`) ; si l'un échoue, renvoie un
tableau vide **pour cette branche** sans faire échouer l'ensemble ; renvoie
`Observable<{a:any[];b:any[];c:any[]}>`.

<details><summary>Solution</summary>

```ts
forkJoin({
  a: this.http.get<any[]>('/A').pipe(catchError(() => of([]))),
  b: this.http.get<any[]>('/B').pipe(catchError(() => of([]))),
  c: this.http.get<any[]>('/C').pipe(catchError(() => of([]))),
});
```
</details>

**Validation.** Tu sais que sans `catchError` par branche, **une** erreur casse tout le `forkJoin`.

---

## Exercice 2.6 — Le piège du `defer`

**Objectifs.** Explique pourquoi (1) échoue à garantir l'ordre et (2) le corrige.

```ts
// (1)
const task$ = from(this.runAsync(file));      // runAsync est async
// (2)
const task$ = defer(() => from(this.runAsync(file)));
```

<details><summary>Solution</summary>

En (1), `this.runAsync(file)` est **appelée immédiatement** au moment de créer `task$` (la
promesse démarre tout de suite), donc avant l'abonnement et en parallèle d'autres tâches. En
(2), `defer` retarde l'appel à `runAsync` jusqu'au **moment de l'abonnement** → respecte
l'ordre d'un `concatMap`. C'est le bug d'import image corrigé.
</details>

**Validation.** Tu identifies « la promesse démarre à la création, pas à l'abonnement ».

---

## Exercice 2.7 — `firstValueFrom` à bon escient

**Objectifs.** Quand préfères-tu `firstValueFrom` à un `.pipe()` ? Donne un exemple du projet
et explique le compromis.

<details><summary>Solution</summary>

Dans une logique **impérative séquentielle** avec boucle/try-catch (ex. `image-import.run()` :
unzip, boucle `for`, calculs intermédiaires), `async/await` via `firstValueFrom` est plus
lisible qu'un pipe. Le compromis : on perd l'annulation/composition RxJS, et il faut penser à
`catchError(()=>of(...))` avant `firstValueFrom` pour les replis. Pour un pipeline de
transformation pur, on garde `.pipe()`.
</details>

**Validation.** Tu cites `image-import.service.ts` et le compromis lisibilité vs composition.

---

## Exercice 2.8 — Lire des marbles (ordre des émissions)

**Contexte.** La source émet `a` à t=0 et `b` à t=10 ms. La « requête » `R(x)` met **50 ms**.

**Objectifs.** Dessine (ou décris) ce que reçoit l'abonné avec `switchMap`, `concatMap`,
`mergeMap`, `exhaustMap`.

<details><summary>Solution</summary>

```
source:      a(0) ---- b(10) -------------------|
switchMap:   R(a) annulé à t=10 ; émet R(b) à ~60      → b
concatMap:   R(a) finit à 50 ; R(b) de 50→100          → a, b
mergeMap:    R(a)→50, R(b)→60 (parallèle)              → a, b (ordre d'arrivée, non garanti en général)
exhaustMap:  R(a) en cours à t=10 → b ignoré           → a
```
- `switchMap` : **un seul** résultat, le dernier (`b`).
- `exhaustMap` : **un seul**, le premier (`a`).
- `concatMap`/`mergeMap` : **les deux**, mais `concatMap` garantit l'ordre, pas `mergeMap`.
</details>

**Validation.** Tu sais distinguer « garde le dernier / garde le premier / garde tout ».

---

## Exercice 2.9 — Anti double-clic à la soumission (`exhaustMap`)

**Contexte métier.** Sur un formulaire de création, un utilisateur clique 3× rapidement sur
« Créer ». Tu ne dois créer **qu'un** ticket.

**Objectifs.** À partir d'un `Subject<void>` de clics, écris le flux qui crée le ticket et
**ignore** les clics tant que le POST est en cours. Donne aussi l'alternative **sans** Subject.

<details><summary>Solution</summary>

```ts
private readonly submit$ = new Subject<void>();
onSubmit() { this.submit$.next(); }
ngOnInit() {
  this.submit$.pipe(
    exhaustMap(() => this.ticketService.create(this.input()).pipe(catchError(() => of(null)))),
    takeUntilDestroyed(this.destroyRef),
  ).subscribe(res => { if (res) this.toast.success('Créé.'); });
}
```
**Alternative projet (sans Subject)** : signal `submitting` + `[disabled]="submitting()"` sur le
bouton, remis à `false` dans `finalize`. Plus simple ici car on a déjà l'état signal.
</details>

**Pièges.** `switchMap` ici **annulerait** la création en cours (mauvais) ; `concatMap` en
créerait 3 (mauvais). C'est bien `exhaustMap`.

**Validation.** Un seul POST malgré 3 clics ; tu connais l'alternative signal.

---

## Exercice 2.10 — Recherche serveur (debounce + distinct + switchMap)

**Contexte métier.** Champ de recherche d'utilisateurs : requêter l'API GLPI, mais sans spammer.

**Objectifs.** À partir d'un `term$` (les frappes), écris un flux qui : ignore les termes < 2
caractères, attend 300 ms d'inactivité, ne re-requête pas un terme identique, annule la requête
précédente, et tombe sur `[]` en cas d'erreur.

<details><summary>Solution</summary>

```ts
this.term$.pipe(
  map(t => t.trim()),
  filter(t => t.length >= 2),
  debounceTime(300),
  distinctUntilChanged(),
  switchMap(t => this.users.search(t).pipe(catchError(() => of([])))),
).subscribe(r => this.results.set(r));
```
</details>

**Pièges.** Mettre `debounceTime` **après** `switchMap` (inutile). Oublier `catchError` **dans**
le `switchMap` (une erreur tuerait le flux de recherche entier).

**Validation.** Tu places le trio dans le bon ordre et le `catchError` au bon endroit.

---

## Exercice 2.11 — `finalize` pour l'état de chargement

**Contexte.** Un chargement met `loading=true`, puis doit le remettre à `false` **dans tous les
cas** (succès, erreur).

**Objectifs.** Réécris ce code pour ne plus dupliquer `loading.set(false)`.
```ts
this.loading.set(true);
this.service.getAll().subscribe({
  next: d => { this.rows.set(d); this.loading.set(false); },
  error: () => { this.error.set('KO'); this.loading.set(false); },
});
```

<details><summary>Solution</summary>

```ts
this.loading.set(true);
this.service.getAll().pipe(finalize(() => this.loading.set(false))).subscribe({
  next:  d => this.rows.set(d),
  error: () => this.error.set('KO'),
});
```
</details>

**Validation.** `finalize` centralise l'extinction du spinner ; plus de duplication.

---

## Exercice 2.12 — `retry` + `timeout` (et quand NE PAS retry)

**Objectifs.**
1. Ajoute à une **lecture** un timeout de 8 s et 2 tentatives à 1 s d'intervalle, repli `[]`.
2. Explique pourquoi tu **n'ajoutes pas** `retry` sur la **création** d'un élément.

<details><summary>Solution</summary>

```ts
this.http.get<X[]>(url).pipe(
  timeout(8000),
  retry({ count: 2, delay: 1000 }),
  catchError(() => of([])),
);
```
2. Un POST de création **n'est pas idempotent** : réessayer après un timeout (alors que le
serveur a peut-être réussi) créerait un **doublon**. On ne retry que les opérations idempotentes
(GET, et PUT/DELETE bien conçus).
</details>

**Validation.** Tu cites l'idempotence comme critère de `retry`.

---

## Exercice 2.13 — `forkJoin` vs `combineLatest`

**Objectifs.** Pour chacun, dis lequel choisir et pourquoi :
1. Charger en parallèle `getTickets()` et `getItems()` puis afficher quand **tout** est prêt.
2. Recalculer une liste filtrée chaque fois que **l'un** des deux filtres (`type$`, `status$`)
   change.

<details><summary>Solution</summary>

1. **`forkJoin`** : sources HTTP qui **complètent**, on veut **une** émission finale.
2. **`combineLatest`** : sources **persistantes** qui ré-émettent ; on veut réagir à **chaque**
   changement. (Dans le projet on ferait souvent ça avec des `signal` + `computed`.)
</details>

**Validation.** « complète une fois » → forkJoin ; « ré-émet dans le temps » → combineLatest.

---

## Exercice 2.14 — Court-circuit avec `first` (cas réel du projet)

**Contexte.** `GlpiImportLookupService.findItemByName` cherche un élément par nom à travers
**tous** les itemtypes, et doit **s'arrêter au premier trouvé** (ne pas interroger les types
suivants inutilement).

**Objectifs.** Écris le flux : `from(ASSET_TYPES)` → pour chaque type une recherche qui renvoie
`{id,type} | null` → s'arrêter au 1er non-null → si rien, émettre `null`.

<details><summary>Solution</summary>

```ts
return from(ASSET_TYPES).pipe(
  concatMap(cfg => this.searchOne(cfg, name)),       // {id,type} | null
  first((r): r is Found => r !== null, null),        // 1er non-null → complète ; sinon null
);
```
`first` **complète** dès le 1er match → le `concatMap` cesse d'émettre → les types restants ne
sont pas interrogés (court-circuit). Le `null` par défaut évite l'erreur « no elements ».
</details>

**Pièges.** `mergeMap` interrogerait **tous** les types en parallèle (pas de court-circuit).
Oublier le `default` de `first` → erreur quand rien n'est trouvé.

**Validation.** Tu expliques le court-circuit (`first` complète → `concatMap` s'arrête).

---

## Exercice 2.15 — Désabonnement & fuites

**Objectifs.** Pour chaque cas, dis s'il faut se désabonner et comment :
1. `this.http.get(...).subscribe(...)` dans `ngOnInit`.
2. `this.clicks$ /* Subject */ .pipe(exhaustMap(...)).subscribe(...)`.
3. Afficher une liste via le template avec `| async`.

<details><summary>Solution</summary>

1. **Pas nécessaire** : `HttpClient` complète après la réponse (one-shot). `take(1)` possible par
   prudence.
2. **Oui** : un Subject **ne complète pas** → fuite. Ajoute `takeUntilDestroyed()`.
3. **Géré automatiquement** : le pipe `async` s'abonne et se désabonne avec le composant.
</details>

**Validation.** Tu distingues « HTTP one-shot (ok) » de « flux persistant (à couper) ».

---

## Exercice 2.16 — Progression en direct avec `scan`

**Contexte métier.** Pendant un import de N lignes séquentielles, afficher « X / N traitées » qui
**monte en temps réel**.

**Objectifs.** À partir de `from(rows)`, sauve chaque ligne en séquence et expose un compteur qui
s'incrémente à chaque ligne (succès ou échec).

<details><summary>Solution</summary>

```ts
from(rows).pipe(
  concatMap(row => this.save(row).pipe(map(() => true), catchError(() => of(false)))),
  scan((acc, _) => acc + 1, 0),         // 1, 2, 3, … en direct
  tap(done => this.progress.set(done)), // maj UI à chaque ligne
).subscribe({ complete: () => this.toast.success('Import terminé.') });
```
</details>

**Pièges.** `reduce` n'émettrait **qu'à la fin** (pas de progression live) ; ici il faut `scan`.

**Validation.** Le compteur monte ligne par ligne ; tu sais `scan` (live) vs `reduce` (final).
