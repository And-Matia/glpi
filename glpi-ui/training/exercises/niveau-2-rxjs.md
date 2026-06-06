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
