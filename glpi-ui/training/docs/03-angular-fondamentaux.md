# 03 — Angular 21 : les fondamentaux du projet

Angular 21 utilisé ici est **moderne** : composants standalone, **signals**, `inject()`,
nouvelle syntaxe de template `@if/@for`. Oublie les `NgModule`, les `*ngIf`, le
`constructor(private x: X)` : ce projet n'en utilise pas.

---

## 1. Composant standalone

Pas de `NgModule`. Chaque composant déclare ses dépendances dans `imports: [...]`.

```ts
@Component({
  selector: 'app-ticket-list',
  imports: [TableComponent, PageHeaderComponent, SpinnerComponent, ButtonComponent], // ← dépendances
  templateUrl: './ticket-list.component.html',
  styleUrl: './ticket-list.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,   // ← TOUJOURS OnPush
})
export class TicketListComponent { /* ... */ }
```

**Convention projet :** tous les composants sont `OnPush`. Combiné aux signals, ça donne des
performances optimales et un rendu prévisible.

> ⚠️ **Piège classique :** tu utilises `<app-badge>` dans le template mais tu oublies de
> l'ajouter à `imports`. Erreur de compilation `NG8113`/template. Inversement, un composant
> importé mais **pas utilisé** dans le template déclenche un *warning* `NG8113` (on l'a
> nettoyé dans `ticket-list` et `item-list`).

---

## 2. `inject()` au lieu du constructeur

**Convention projet : on n'utilise jamais l'injection par constructeur.**

```ts
export class SuperCostComponent implements OnInit {
  private readonly itemService   = inject(ItemV1Service);
  private readonly ticketService = inject(TicketV1Service);
}
```

C'est plus concis, ça marche aussi dans les fonctions (guards, interceptors, initializers) :

```ts
export const authGuard: CanActivateFn = () => {
  const auth   = inject(AuthService);
  const router = inject(Router);
  return auth.isLoggedIn() ? true : router.createUrlTree(['/back-office/login']);
};
```

---

## 3. Les Signals : l'état réactif

Un **signal** est une valeur réactive. On le lit en l'**appelant** : `mySignal()`.

### `signal()` — état mutable

```ts
readonly loading = signal(true);            // création
readonly tickets = signal<Ticket[]>([]);

this.loading();          // LECTURE → true
this.loading.set(false); // ÉCRITURE (remplace)
this.tickets.update(list => [...list, newTicket]); // ÉCRITURE (à partir de l'ancienne valeur)
```

> ⚠️ **Piège #1 :** oublier les parenthèses. `loading` est le signal (fonction),
> `loading()` est la valeur. Dans un template : `@if (loading()) { … }`.
>
> ⚠️ **Piège #2 :** muter en place. Ne fais PAS `this.tickets().push(x)`.
> Crée une nouvelle référence : `this.tickets.update(l => [...l, x])`. OnPush + signals
> détectent le changement par **nouvelle référence**.

### `computed()` — état dérivé (lecture seule)

Recalculé automatiquement quand un signal dont il dépend change. Exemple réel
(`super-cost.component.ts`) :

```ts
readonly items = signal<Item[]>([]);

readonly itemsByType = computed(() =>
  ASSET_TYPES
    .map(cfg => ({ label: cfg.label, count: this.items().filter(i => i.item_type === cfg.itemtype).length }))
    .filter(entry => entry.count > 0)
);
```

Dès que `items` change, `itemsByType()` est recalculé. **Quand l'utiliser ?** Pour toute
valeur qui se *déduit* d'autres signaux (filtrage, comptage, agrégation). N'écris jamais un
champ qui doit « rester synchro » à la main : fais-en un `computed`.

Autre exemple (`item-list.component.ts`) — filtrage multicritère :

```ts
readonly filteredItems = computed(() => {
  const text = this.searchText().toLowerCase().trim();
  const type = this.filterType();
  return this.items().filter(item =>
    (!text || [item.name, item.user, item.location].some(v => v.toLowerCase().includes(text)))
    && (!type || item.item_type === type)
  );
});
```

### `input()` — propriété entrante d'un composant

Remplace `@Input()`. Exemple (`button.component.ts`) :

```ts
variant  = input<ButtonVariant>('primary');   // valeur par défaut
size     = input<ButtonSize>('md');
loading  = input<boolean>(false);
disabled = input<boolean>(false);

// usage interne : this.disabled()  (c'est un signal en lecture seule)
```

Variante **obligatoire** : `input.required<SelectOption[]>()`.

Côté parent (template) :
```html
<app-button variant="danger" [loading]="isProcessing()" (clicked)="reset()">Reset</app-button>
```

### `output()` — événement sortant

Remplace `@Output()`. Exemple (`button.component.ts`) :

```ts
clicked = output<void>();

onClick() {
  if (!this.disabled() && !this.loading()) this.clicked.emit();
}
```

### `model()` — liaison bidirectionnelle `[(value)]`

Pour un composant de formulaire qui doit lire ET écrire la valeur du parent.
Exemple (`search-input.component.ts`) :

```ts
value = model<string>('');   // → permet [(value)]="maVariable"
```

Côté parent :
```html
<app-search-input [(value)]="searchText" placeholder="Rechercher…" />
```
Ici `searchText` est un `signal<string>` du parent. La liaison `[(value)]` se synchronise
dans les deux sens.

> 🧠 **Règle de choix :**
> - donnée qui **entre** → `input()`
> - événement qui **sort** → `output()`
> - donnée qui **entre ET sort** (formulaires) → `model()`
> - état **interne** d'un composant/service → `signal()`
> - valeur **dérivée** d'autres signaux → `computed()`

---

## 4. Nouvelle syntaxe de template `@if` / `@for`

Plus de `*ngIf` / `*ngFor`. On écrit :

```html
@if (loading()) {
  <app-spinner size="lg" />
} @else if (error()) {
  <p class="error">{{ error() }}</p>
} @else {
  @for (item of itemsByType(); track item.label) {
    <div>{{ item.label }} : {{ item.count }}</div>
  } @empty {
    <p>Aucun élément</p>
  }
}
```

- **`track` est obligatoire** dans `@for`. Utilise un identifiant stable (`item.id`,
  `item.label`) ou `$index` en dernier recours.
- `@empty` gère le cas liste vide.
- Variables implicites disponibles : `$index`, `$first`, `$last`, `$even`, `$odd`.

> ⚠️ **Piège :** `track $index` quand la liste est réordonnée/filtrée peut provoquer des bugs
> d'affichage. Préfère une clé unique métier.

---

## 5. Cycle de vie : `OnInit`

On charge les données dans `ngOnInit` (pas dans le constructeur) :

```ts
export class TicketListComponent implements OnInit {
  private readonly ticketService = inject(TicketV1Service);
  readonly loading = signal(true);
  readonly rows    = signal<Record<string, any>[]>([]);

  ngOnInit(): void {
    this.ticketService.getAll().subscribe({
      next:  tickets => { this.rows.set(tickets.map(/* … */)); this.loading.set(false); },
      error: err     => { this.error.set(err.message); this.loading.set(false); },
    });
  }
}
```

---

## 6. Routing & lazy loading

`app.routes.ts` charge chaque page à la demande via `loadComponent` :

```ts
{
  path: 'tickets/:id',
  loadComponent: () =>
    import('./features/back-office/tickets/ticket-detail/ticket-detail.component')
      .then(m => m.TicketDetailComponent),
}
```

Lire un paramètre de route (`ticket-detail.component.ts`) :

```ts
private readonly route = inject(ActivatedRoute);
const id = Number(this.route.snapshot.paramMap.get('id'));
```

Naviguer par code :
```ts
private readonly router = inject(Router);
this.router.navigate(['/back-office/tickets', row['id']]);
```

Le groupe de routes `/back-office` est protégé par `canActivate: [authGuard]`.

---

## 7. `APP_INITIALIZER` : du code AVANT l'affichage

`app.config.ts` initialise la session GLPI avant le rendu :

```ts
provideAppInitializer(() => inject(GlpiSessionService).initAll())
```

`initAll()` est `async` → Angular attend sa résolution avant d'afficher l'app. C'est ainsi
que les tokens (v1 + OAuth) sont prêts dès le premier appel HTTP.

---

## 8. Récap des erreurs fréquentes

| ❌ | ✅ |
|----|----|
| `if (loading)` dans un template | `@if (loading())` (parenthèses !) |
| `this.items().push(x)` | `this.items.update(l => [...l, x])` |
| `constructor(private s: Service)` | `private readonly s = inject(Service)` |
| Oublier `track` dans `@for` | `@for (x of list; track x.id)` |
| Composant utilisé mais absent de `imports` | l'ajouter à `imports: [...]` |
| Charger les données dans le `constructor` | les charger dans `ngOnInit` |

➡️ Ensuite, le morceau le plus important : **`04-rxjs.md`**.
