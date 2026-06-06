# Niveau 4 — Petites fonctionnalités nouvelles

On crée du neuf, bien intégré dans l'architecture. Chaque exercice = service (si besoin) +
composant/route + UI + constantes.

---

## Exercice 4.1 — Page « Statistiques des coûts »

**Contexte métier.** L'admin veut une page back-office montrant le **coût total** (somme de
`cost_time + cost_fixed`) et le **temps total** (`actiontime`) de tous les tickets.

**Objectifs.**
- Créer un `TicketCostV1Service.getAll()` (s'il manque) qui lit `/TicketCost`.
- Créer une route `/back-office/costs` + un composant qui affiche 3 cartes : coût total,
  temps total (en heures), nombre de coûts.

**Contraintes.** v1 ; tokens CSS ; `app-card`/`app-page-header` ; OnPush + signals.

**Fichiers.** `core/services/glpi/ticket-cost/ticket-cost-v1.service.ts`,
`core/models/ticket-cost.model.ts`, nouveau dossier `features/back-office/costs/`,
`app.routes.ts`, `sidebar.component.html`.

**Compétences.** Créer un service de lecture + mapping, nouvelle route lazy, computed, UI.

<details><summary>Solution (extrait)</summary>

Service :
```ts
@Injectable({ providedIn: 'root' })
export class TicketCostV1Service {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.glpi.v1ApiUrl}/TicketCost`;
  getAll(): Observable<TicketCost[]> {
    return this.http.get<any[]>(`${this.base}?range=0-9999`).pipe(
      catchError(() => of([])),
      map(raws => raws.map(r => ({
        id: r.id, ticketId: r.tickets_id,
        actiontime: Number(r.actiontime) || 0,
        costTime: Number(r.cost_time) || 0,
        costFixed: Number(r.cost_fixed) || 0,
      }))));
  }
}
```
Composant :
```ts
readonly costs = signal<TicketCost[]>([]);
readonly totalCost = computed(() => this.costs().reduce((s, c) => s + c.costTime + c.costFixed, 0));
readonly totalHours = computed(() => Math.round(this.costs().reduce((s, c) => s + c.actiontime, 0) / 360) / 10);
ngOnInit() { this.service.getAll().subscribe({ next: c => { this.costs.set(c); this.loading.set(false); } }); }
```
Route : un `loadComponent` sous les enfants de `/back-office`. Sidebar : un lien
`/back-office/costs`.
</details>

**Pièges.** GLPI renvoie `cost_time` en string (`"8.7000"`) → `Number(...)`. `range` pour
éviter la pagination. Oublier le lien sidebar.

**Validation.** La page affiche 3 cartes cohérentes ; build OK ; lien dans la sidebar.

---

## Exercice 4.2 — Recherche globale dans la liste des tickets

**Contexte métier.** Pouvoir filtrer la liste des tickets par texte (titre + aperçu).

**Objectifs.** Ajouter un `app-search-input` au-dessus de la table, filtrer les lignes par le
texte (insensible à la casse) sur le titre.

**Fichiers.** `ticket-list.component.ts` (+ `.html`).

**Compétences.** `app-search-input` (`[(value)]`), `computed`, signals.

<details><summary>Solution (extrait)</summary>

```ts
readonly search = signal('');
readonly allRows = signal<Record<string, any>[]>([]);   // remplace `rows` (la donnée brute)
readonly rows = computed(() => {
  const q = this.search().toLowerCase().trim();
  return !q ? this.allRows() : this.allRows().filter(r => String(r['titre']).toLowerCase().includes(q));
});
```
HTML : `<app-search-input [(value)]="search" placeholder="Rechercher un ticket…" />` + ajouter
`SearchInputComponent` aux imports. La table lit `[rows]="rows()"`.
</details>

**Pièges.** Filtrer directement le signal source (perte de données) → garder `allRows` brut +
`rows` dérivé. Oublier l'import du composant.

**Validation.** La recherche filtre en direct ; effacer le texte restaure tout.

---

## Exercice 4.3 — Badge de compteur dans la sidebar

**Contexte métier.** Afficher le nombre de tickets « New » à côté du lien Tickets.

**Objectifs.** Charger le nombre une fois, l'exposer, l'afficher en `app-badge`.

**Fichiers.** `sidebar.component.ts/.html` (et éventuellement un petit service ou réutiliser
`TicketV1Service`).

**Compétences.** Injection de service dans un composant de layout, `signal`, `computed`.

<details><summary>Solution (extrait)</summary>

```ts
private readonly ticketService = inject(TicketV1Service);
readonly newCount = signal(0);
ngOnInit() { this.ticketService.getAll().subscribe(ts => this.newCount.set(ts.filter(t => t.status === 1).length)); }
```
HTML : `@if (newCount() > 0) { <app-badge variant="info" size="sm">{{ newCount() }}</app-badge> }`.
</details>

**Pièges.** Recharger à chaque navigation ; oublier `OnPush` (signals gèrent le refresh).

**Validation.** Le badge montre le bon nombre, masqué si 0.

---

## Exercice 4.4 — Champ « N° de série » dans l'import des éléments

**Contexte métier.** Le CSV pourrait contenir une colonne `Serial`. On veut l'importer dans le
champ GLPI `serial`.

**Objectifs.** Lire `Serial` du CSV (optionnel) et l'envoyer dans l'`input` de création.

**Fichiers.** `item-import.service.ts` (interface `ItemRow`, `parseFile`, `importRow`).

**Compétences.** Étendre un parser CSV + un POST, sans casser l'existant.

<details><summary>Solution (extrait)</summary>

Dans `ItemRow` ajouter `serial: string`. Dans `parseFile` :
`serial: record['Serial'] ?? ''`. Dans `importRow`, ajouter `serial: row.serial` à l'`input`.
</details>

**Pièges.** Rendre la colonne **obligatoire** (elle doit rester optionnelle). Oublier de la
lire dans `parseFile`.

**Validation.** Avec une colonne `Serial`, la valeur apparaît dans GLPI ; sans la colonne,
l'import marche toujours.

---

## Exercice 4.5 — Bouton « Rafraîchir » sur le dashboard

**Contexte métier.** Recharger les chiffres sans recharger la page.

**Objectifs.** Extraire le chargement dans une méthode `load()`, l'appeler dans `ngOnInit` et
sur un bouton « Rafraîchir » (avec état `loading`).

**Fichiers.** `dashboard.component.ts` (+ `.html`).

<details><summary>Solution (extrait)</summary>

```ts
load() {
  this.loading.set(true);
  forkJoin({ tickets: this.ticketService.getAll(), items: this.itemService.getAll() }).subscribe({
    next: ({ tickets, items }) => { this.tickets.set(tickets); this.items.set(items); this.loading.set(false); },
    error: e => { this.error.set(e.message); this.loading.set(false); },
  });
}
ngOnInit() { this.load(); }
```
HTML (dans `app-page-header`) : `<app-button variant="ghost" [loading]="loading()" (clicked)="load()">Rafraîchir</app-button>`.
</details>

**Pièges.** Oublier de remettre `loading` à `true` au début ; multiplier les souscriptions.

**Validation.** Le bouton recharge les chiffres, montre un état de chargement.
