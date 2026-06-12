# 15 — RxJS Pratique : Promises, Arrow Functions, Opérateurs

> Compléments pratiques au doc 04-rxjs.md. Patterns concrets utilisés dans le projet.

---

## 1. Observable → Promise : `firstValueFrom`

```typescript
import { firstValueFrom } from 'rxjs';

// Service retourne Observable
getTickets(): Observable<Ticket[]> {
  return this.http.get<Ticket[]>('/api/tickets');
}

// Composant : consommer avec async/await
async ngOnInit(): Promise<void> {
  this.loading.set(true);
  try {
    const tickets = await firstValueFrom(this.ticketService.getTickets());
    this.tickets.set(tickets);
  } catch (err) {
    this.error.set('Erreur de chargement');
  } finally {
    this.loading.set(false);
  }
}
```

**Règle** : dans les composants, **toujours** `firstValueFrom()` + `async/await`. Ne jamais `.subscribe()` dans un composant.

---

## 2. Arrow Functions dans `.pipe()`

Chaque opérateur reçoit une **fonction flèche** comme argument.

```typescript
// Anatomie d'un pipe
source$.pipe(
  // op(fn) où fn est une arrow function
  map(item => item.id),                          // transform 1 → 1
  filter(id => id > 0),                          // garder si vrai
  tap(id => console.log('id:', id)),             // side-effect
  switchMap(id => this.service.getById(id)),     // 1 → Observable (annule le précédent)
  catchError(err => {                            // intercepter erreur
    console.error(err);
    return of(null);                             // valeur de repli
  })
);
```

### Fonctions flèches multi-lignes

```typescript
// Court (1 expression)
map(ticket => ticket.status)

// Moyen (destructuring)
map(({ id, status, titre }) => ({ id, status, titre }))

// Long (bloc avec return)
map(raw => {
  const date = new Date(raw.date_creation);
  return {
    id: raw.id,
    titre: raw.name,
    date: date.toLocaleDateString('fr-FR'),
  };
})
```

### Fonctions flèches dans `switchMap` / `concatMap`

```typescript
// Appel API → retourner un Observable
switchMap(query => this.service.search(query))

// Appel API avec gestion d'erreur PAR LIGNE
concatMap(ticket =>
  this.service.save(ticket).pipe(
    map(() => ({ id: ticket.id, ok: true })),
    catchError(err => of({ id: ticket.id, ok: false, error: err.message }))
  )
)

// Avec destructuring des paramètres
concatMap(({ id, name }) =>
  this.service.create({ id, name })
)
```

---

## 3. Pattern Séquentiel (Écriture en chaîne)

```typescript
// Créer un ticket PUIS ajouter les éléments liés un par un
async createTicketWithItems(data: CreateInput): Promise<number> {
  return await firstValueFrom(
    this.ticketService.create(data.ticket).pipe(
      switchMap(({ id }) =>
        from(data.items).pipe(
          concatMap(itemId =>
            this.ticketService.addItem(id, itemId).pipe(
              catchError(() => of(null)) // ne pas bloquer si un item échoue
            )
          ),
          toArray(),           // attendre que tous les items soient traités
          map(() => id)        // retourner l'id du ticket créé
        )
      )
    )
  );
}
```

---

## 4. Pattern Parallèle (`forkJoin`)

```typescript
// Charger plusieurs ressources en parallèle
async loadDashboard(): Promise<void> {
  const { tickets, items, stats } = await firstValueFrom(
    forkJoin({
      tickets: this.ticketService.getAll().pipe(catchError(() => of([]))),
      items:   this.itemService.getAll().pipe(catchError(() => of([]))),
      stats:   this.statsService.get().pipe(catchError(() => of(null))),
    })
  );

  this.tickets.set(tickets);
  this.items.set(items);
  this.stats.set(stats);
}
```

---

## 5. `Promise.all` vs `forkJoin`

```typescript
// Promise.all — quand les services retournent des Promises
const [tickets, items] = await Promise.all([
  this.ticketService.getAll(),   // si getAll() retourne Promise<Ticket[]>
  this.itemService.getAll(),     // si getAll() retourne Promise<Item[]>
]);

// forkJoin — quand les services retournent des Observables
const { tickets, items } = await firstValueFrom(
  forkJoin({
    tickets: this.ticketService.getAll$(),   // si getAll$() retourne Observable<Ticket[]>
    items:   this.itemService.getAll$(),
  })
);

// Dans ce projet : les services retournent Observable → utiliser forkJoin
// firstValueFrom() convertit le forkJoin résultant en Promise awaitable
```

---

## 6. `from()` — Convertir Promise ou Array en Observable

```typescript
import { from } from 'rxjs';

// Array → Observable (émet un par un)
from([1, 2, 3]).subscribe(console.log); // 1, 2, 3

// Promise → Observable (émet 1 valeur puis complète)
from(fetch('/api/data')).pipe(
  switchMap(res => from(res.json()))
);

// Async function → Observable
from(async () => {
  const data = await this.service.load();
  return data;
}()); // Attention : exécution IMMÉDIATE

// Bonne pratique : defer() pour différer l'exécution
defer(() => from(this.service.load())); // exécuté seulement à la subscription
```

---

## 7. `defer()` — Éviter l'Exécution Anticipée

```typescript
import { defer, from } from 'rxjs';

// MAUVAIS : asyncFunc() s'exécute immédiatement à la création de l'Observable
const bad$ = from(asyncFunc()); // asyncFunc() appelé ICI

// BON : asyncFunc() s'exécute seulement quand on s'abonne
const good$ = defer(() => from(asyncFunc())); // asyncFunc() appelé à la subscription

// Utilisation dans un pipe d'import (chaque étape doit utiliser les données de la précédente)
from(importTasks).pipe(
  concatMap(task => defer(() => from(task.execute()))) // chaque execute() utilise les registres à jour
)
```

---

## 8. Gestion d'Erreurs par Ligne

```typescript
// Import : chaque ligne indépendante, une erreur ne bloque pas les suivantes
from(csvRows).pipe(
  concatMap(row =>
    this.service.save(row).pipe(
      map(() => ({ row: row.id, ok: true, error: null })),
      catchError(err =>
        of({ row: row.id, ok: false, error: err.message }) // ← catchError DANS concatMap
      )
    )
  ),
  toArray(), // collecter tous les résultats
  map(results => ({
    total:   results.length,
    success: results.filter(r => r.ok).length,
    failed:  results.filter(r => !r.ok).length,
    errors:  results.filter(r => !r.ok).map(r => ({ row: r.row, error: r.error })),
  }))
);
```

**Règle** : `catchError` DANS `concatMap` = erreur par ligne. `catchError` APRÈS `concatMap` = tout annule.

---

## 9. Opérateurs Courants — Quick Reference

| Opérateur | Signature | Quand l'utiliser |
|-----------|-----------|-----------------|
| `map` | `map(x => y)` | Transformer chaque valeur |
| `filter` | `filter(x => bool)` | Garder selon condition |
| `tap` | `tap(x => sideEffect)` | Log, set signal, sans modifier |
| `switchMap` | `switchMap(x => obs$)` | Recherche, annule requête précédente |
| `concatMap` | `concatMap(x => obs$)` | Writes séquentiels, import |
| `mergeMap` | `mergeMap(x => obs$)` | Parallèle sans ordre (rare) |
| `exhaustMap` | `exhaustMap(x => obs$)` | Anti-double clic |
| `forkJoin` | `forkJoin({a$, b$})` | Attendre plusieurs HTTP |
| `catchError` | `catchError(err => obs$)` | Repli sur erreur |
| `finalize` | `finalize(() => side)` | `finally` pour Observables |
| `toArray` | `toArray()` | Grouper toutes les émissions |
| `debounceTime` | `debounceTime(300)` | Attendre pause saisie |
| `distinctUntilChanged` | `distinctUntilChanged()` | Ignorer valeur identique |
| `takeUntilDestroyed` | `takeUntilDestroyed(ref)` | Auto-unsubscribe |
| `retry` | `retry(3)` | Réessayer N fois |
| `from` | `from(arr \| promise)` | Array ou Promise → Observable |
| `of` | `of(val)` | Créer Observable d'une valeur |
| `defer` | `defer(() => obs$)` | Différer création |

---

## 10. Pattern Progression Live avec `scan`

```typescript
// Calculer la progression pendant un import
from(csvRows).pipe(
  concatMap(row =>
    this.service.save(row).pipe(
      map(() => ({ ok: true })),
      catchError(() => of({ ok: false }))
    )
  ),
  scan(
    (acc, result) => ({
      done:    acc.done + 1,
      success: acc.success + (result.ok ? 1 : 0),
      failed:  acc.failed  + (result.ok ? 0 : 1),
      total:   acc.total,
    }),
    { done: 0, success: 0, failed: 0, total: csvRows.length }
  ),
  tap(progress => {
    const pct = Math.round((progress.done / progress.total) * 100);
    this.progress.set(pct); // update signal en live
  }),
  last() // ne garder que le dernier (résultat final)
);
```

---

## 11. `takeUntilDestroyed` — Auto-Unsubscribe

```typescript
import { DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

export class MyComponent {
  private readonly destroyRef = inject(DestroyRef);

  ngOnInit(): void {
    // Observable persistant (BehaviorSubject, interval…)
    this.someService.data$.pipe(
      takeUntilDestroyed(this.destroyRef) // se désabonne à la destruction du composant
    ).subscribe(data => this.data.set(data));
  }
}
```

**Quand utiliser** : seulement pour les Observables persistants (Subject, BehaviorSubject, interval). Les HTTP callables sont one-shot (complètent automatiquement).

---

## 12. Lecture d'un Pipe Complexe (méthode)

```typescript
// Comment lire ce pipe
this.http.get<Raw[]>('/api/items').pipe(    // 1. Source HTTP
  map(raws => raws.map(r => mapItem(r))),  // 2. Transformer chaque raw → Item
  catchError(err => {                       // 3. Si erreur → retourner []
    console.error(err);
    return of([]);
  })
)
```

**Méthode** :
1. Identifier la **source** (HTTP, Subject, from…)
2. Lire les **opérateurs** de haut en bas
3. Pour chaque `*Map` : identifier quel nouveau Observable il crée
4. Vérifier l'emplacement du `catchError` (dedans = par ligne, dehors = global)
5. Identifier la **valeur finale** qui sort du pipe

---

## 13. Pièges Arrow Functions

| Erreur | Cause | Correction |
|--------|-------|------------|
| `map(x => { x.id })` retourne `undefined` | Bloc `{}` sans `return` | `map(x => ({ id: x.id }))` ou `map(x => { return x.id; })` |
| `tap(x => this.data.set(x))` — `this` undefined | Arrow function perd le contexte si pas dans la classe | Arrow function conserve `this` → pas de problème dans une classe TypeScript |
| `from(this.service.load())` s'exécute trop tôt | `load()` appelé à la création | Entourer de `defer(() => from(...))` |
| `switchMap(x => this.service.get(x)).subscribe(...)` — fuite mémoire | Subscription non nettoyée | Utiliser `firstValueFrom()` + `async/await`, ou `takeUntilDestroyed` |
| `concatMap` mais résultats dans le mauvais ordre | Utilisé `mergeMap` par erreur | `concatMap` garantit l'ordre, `mergeMap` non |
