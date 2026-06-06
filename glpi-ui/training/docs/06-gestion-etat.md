# 06 — Gestion de l'état

Le projet n'utilise **aucune** librairie d'état (pas de NgRx). L'état repose sur 3 mécanismes
simples et suffisants.

## 1. État local de composant : `signal` + `computed`

Chaque page gère son propre état avec des signaux. Modèle type :

```ts
export class ItemListComponent implements OnInit {
  // état brut
  readonly loading = signal(true);
  readonly error   = signal('');
  readonly items   = signal<Item[]>([]);
  // critères de filtre (état d'UI)
  readonly searchText   = signal('');
  readonly filterType   = signal('');
  readonly filterStatus = signal('');
  // état dérivé (recalculé automatiquement)
  readonly filteredItems = computed(() => { /* filtre items() selon les 3 critères */ });
  readonly rows = computed(() => this.filteredItems().map(/* → ligne de table */));
}
```

**Principe :** une seule source de vérité (`items`, et les critères), tout le reste est
`computed`. On ne stocke jamais une donnée qu'on peut **dériver**.

> ⚠️ Piège : recopier `filteredItems` dans un autre signal « pour le garder ». Non : laisse-le
> `computed`, il reste toujours à jour.

## 2. État partagé : service `providedIn: 'root'` exposant des signaux

Un service singleton porte l'état partagé entre composants.

### `AuthService` — « suis-je connecté ? »
```ts
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly user = signal<string | null>(localStorage.getItem('backOfficePassword'));
  readonly isLoggedIn = computed(() => this.user() !== null);

  login(code: string): boolean {
    if (code === environment.backOfficePassword) {
      localStorage.setItem('backOfficePassword', code);
      this.user.set(code);
      return true;
    }
    return false;
  }
  logout(): void { localStorage.removeItem('backOfficePassword'); this.user.set(null); }
}
```
- L'état (`user`) est **initialisé depuis `localStorage`** → persistant entre rechargements.
- `isLoggedIn` est un `computed` consommé par le guard (`authGuard`).

### `ToastService` — notifications globales
```ts
@Injectable({ providedIn: 'root' })
export class ToastService {
  readonly toasts = signal<Toast[]>([]);
  private next = 0;
  show(message: string, variant: ToastVariant = 'info', duration = 3500): void {
    const id = ++this.next;
    this.toasts.update(list => [...list, { id, message, variant }]);
    setTimeout(() => this.dismiss(id), duration);
  }
  success(m: string){ this.show(m,'success'); }
  error(m: string){ this.show(m,'danger'); }
  dismiss(id: number){ this.toasts.update(l => l.filter(t => t.id !== id)); }
}
```
Un composant `<app-toast />` placé **une seule fois** dans `app.html` lit `toasts()` et
affiche la pile. N'importe quel composant injecte `ToastService` et appelle `.success(...)`.

> 🧠 Pattern « signal exposé en lecture » : le service expose `readonly toasts` (un signal),
> les composants le **lisent**, mais ne le mutent que via les méthodes du service.

## 3. État métier persistant : `ImportRegistryService`

Cas particulier riche d'enseignements. Il mémorise les correspondances créées à l'import
(nom d'élément → id GLPI, réf CSV de ticket → id GLPI) et les **persiste en localStorage**.

```ts
@Injectable({ providedIn: 'root' })
export class ImportRegistryService {
  private items   = new Map<string, { id: number; item_type: ItemType }>();
  private tickets = new Map<number, number>();   // refCSV → idGLPI

  constructor() { this.load(); }                 // recharge depuis localStorage au démarrage

  registerTicket(csvRef: number, glpiId: number) { this.tickets.set(csvRef, glpiId); this.save(); }
  getTicketId(csvRef: number) { return this.tickets.get(csvRef); }
  clearAll() { this.items.clear(); this.tickets.clear(); localStorage.removeItem(STORAGE_KEY); }
  private load() { /* JSON.parse(localStorage) → Map */ }
  private save() { /* Map → JSON.stringify → localStorage */ }
}
```

**Pourquoi persister ?** Parce que les fichiers peuvent être importés **séparément** :
- on importe la feuille 2 (tickets) → le registre mémorise `ref 1 → ticket GLPI #2` ;
- plus tard (autre session), on importe la feuille 3 (coûts) **seule** → le registre, rechargé
  depuis localStorage, permet de retrouver le bon ticket.

**Cohérence avec GLPI :** quand on **réinitialise** (page Reset), on appelle
`registry.clearAll()` pour ne pas garder des correspondances pointant vers des ids supprimés.

> 🧠 C'est l'exemple parfait d'un état qui n'est NI local à un composant NI dérivable :
> il modélise un lien métier entre des données externes. Il vit donc dans un service dédié.

## 4. Pourquoi pas de NgRx ?

Parce que l'app est **orientée requêtes** : chaque page charge ce dont elle a besoin à
l'`ngOnInit`, l'état partagé est minime (auth, toasts, registre). Ajouter NgRx serait du
sur-poids. **Leçon :** choisir l'outil à la taille du problème.

## 5. Flux d'état d'une page type

```
ngOnInit ──▶ service.getAll().subscribe ──▶ this.items.set(data) ; this.loading.set(false)
                                                   │
                       (signaux) ─────────────────┘
                                                   ▼
            computed filteredItems()/rows()  ──▶  template @for (row of rows())
                                                   ▲
        l'utilisateur tape ──▶ searchText.set(x) ──┘ (re-calcul automatique)
```

## 6. Erreurs fréquentes

| ❌ | ✅ |
|----|----|
| Stocker un état dérivé dans un `signal` séparé | `computed()` |
| Muter un Map/array en place puis attendre un re-render | recréer la référence + `signal.update` |
| Mettre l'auth dans un composant | service `root` + `computed isLoggedIn` |
| Oublier de vider le registre après un reset | `registry.clearAll()` dans le succès du reset |
| Lire un signal sans `()` | `this.items()` |

➡️ Ensuite : **`07-composants-ui.md`**.
