# 13 — Recherche & Filtres

> Filtres avancés, chips, autocomplete avec catégories, debounce + annulation, persistance, favoris, partage URL.

---

## 1. Filtres Avancés Repliables avec Chips

```typescript
// Signaux des filtres
readonly searchText   = signal('');
readonly filterType   = signal<string | null>(null);
readonly filterStatus = signal<number | null>(null);
readonly filterDateFrom = signal('');
readonly filterDateTo   = signal('');

// Chips actifs (dérivés des filtres)
readonly activeChips = computed(() => {
  const chips: { key: string; label: string }[] = [];
  if (this.searchText().trim())
    chips.push({ key: 'search', label: `Recherche: "${this.searchText()}"` });
  if (this.filterType())
    chips.push({ key: 'type', label: `Type: ${this.filterType()}` });
  if (this.filterStatus() !== null)
    chips.push({ key: 'status', label: `Statut: ${statusLabel(this.filterStatus()!)}` });
  if (this.filterDateFrom())
    chips.push({ key: 'from', label: `Depuis: ${this.filterDateFrom()}` });
  if (this.filterDateTo())
    chips.push({ key: 'to', label: `Jusqu'au: ${this.filterDateTo()}` });
  return chips;
});

readonly hasFilters = computed(() => this.activeChips().length > 0);

removeChip(key: string): void {
  switch (key) {
    case 'search': this.searchText.set(''); break;
    case 'type':   this.filterType.set(null); break;
    case 'status': this.filterStatus.set(null); break;
    case 'from':   this.filterDateFrom.set(''); break;
    case 'to':     this.filterDateTo.set(''); break;
  }
}

clearAllFilters(): void {
  this.searchText.set('');
  this.filterType.set(null);
  this.filterStatus.set(null);
  this.filterDateFrom.set('');
  this.filterDateTo.set('');
}

// Données filtrées
readonly filteredRows = computed(() => {
  let rows = this.allRows();
  const q = this.searchText().toLowerCase().trim();

  if (q) rows = rows.filter(r =>
    r.titre?.toLowerCase().includes(q) ||
    r.description?.toLowerCase().includes(q)
  );
  if (this.filterType()) rows = rows.filter(r => r.type === this.filterType());
  if (this.filterStatus() !== null) rows = rows.filter(r => r.status === this.filterStatus());
  if (this.filterDateFrom()) rows = rows.filter(r => r.date >= this.filterDateFrom());
  if (this.filterDateTo())   rows = rows.filter(r => r.date <= this.filterDateTo());

  return rows;
});

// Panneau repliable
readonly filtersOpen = signal(false);
```

```html
<!-- En-tête des filtres -->
<div class="filter-bar">
  <app-search-input [(value)]="searchText" placeholder="Rechercher…" />
  <button mat-stroked-button (click)="filtersOpen.update(v => !v)">
    <i class="fa-solid fa-sliders"></i>
    Filtres
    @if (hasFilters()) {
      <app-badge variant="primary" size="sm">{{ activeChips().length }}</app-badge>
    }
  </button>
  @if (hasFilters()) {
    <button mat-button (click)="clearAllFilters()">Tout effacer</button>
  }
</div>

<!-- Panneau de filtres avancés -->
@if (filtersOpen()) {
  <div class="filter-panel">
    <div class="filter-grid">
      <app-select label="Type" [options]="typeOptions" [(value)]="filterType" />
      <app-select label="Statut" [options]="statusOptions" [(value)]="filterStatus" />
      <app-input label="Date depuis" type="date" [(value)]="filterDateFrom" />
      <app-input label="Date jusqu'au" type="date" [(value)]="filterDateTo" />
    </div>
  </div>
}

<!-- Chips actifs -->
@if (activeChips().length > 0) {
  <mat-chip-set class="active-chips">
    @for (chip of activeChips(); track chip.key) {
      <mat-chip (removed)="removeChip(chip.key)">
        {{ chip.label }}
        <button matChipRemove aria-label="Supprimer ce filtre">
          <i class="fa-solid fa-xmark fa-xs"></i>
        </button>
      </mat-chip>
    }
  </mat-chip-set>
}

<!-- Compteur de résultats -->
<p class="results-count">{{ filteredRows().length }} résultat(s)</p>
```

```typescript
imports: [MatChipsModule, /* … */]
```

```css
.filter-bar { display: flex; gap: var(--spacing-2); align-items: center; flex-wrap: wrap; }
.filter-panel {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-8);
  padding: var(--spacing-4);
  margin: var(--spacing-2) 0;
  animation: slideDown 0.15s ease;
}
.filter-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--spacing-3);
}
.active-chips { margin: var(--spacing-2) 0; }
```

---

## 2. Persistance des Filtres (localStorage)

```typescript
private readonly FILTERS_KEY = 'search-filters-tickets';

ngOnInit(): void {
  this.restoreFilters();
  // … charger données
}

private saveFilters(): void {
  const state = {
    q:      this.searchText(),
    type:   this.filterType(),
    status: this.filterStatus(),
    from:   this.filterDateFrom(),
    to:     this.filterDateTo(),
  };
  localStorage.setItem(this.FILTERS_KEY, JSON.stringify(state));
}

private restoreFilters(): void {
  const raw = localStorage.getItem(this.FILTERS_KEY);
  if (!raw) return;
  try {
    const s = JSON.parse(raw);
    this.searchText.set(s.q ?? '');
    this.filterType.set(s.type ?? null);
    this.filterStatus.set(s.status ?? null);
    this.filterDateFrom.set(s.from ?? '');
    this.filterDateTo.set(s.to ?? '');
  } catch {
    localStorage.removeItem(this.FILTERS_KEY);
  }
}

// Sauvegarder à chaque changement de filtre (via effect ou directement)
// Option A : appeler saveFilters() dans chaque setter
setSearchText(v: string): void { this.searchText.set(v); this.saveFilters(); }

// Option B : effect (plus élégant)
constructor() {
  effect(() => {
    // Lire tous les signaux pour déclencher l'effect
    this.searchText(); this.filterType(); this.filterStatus();
    this.filterDateFrom(); this.filterDateTo();
    this.saveFilters();
  });
}
```

---

## 3. Autocomplete avec Catégories (mat-autocomplete)

```typescript
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged, switchMap, catchError, of } from 'rxjs';

interface Suggestion {
  category: 'Éléments' | 'Tickets' | 'Techniciens';
  id: number;
  label: string;
}

readonly searchCtrl = new FormControl('');
readonly suggestions = signal<Suggestion[]>([]);
readonly searching   = signal(false);

// Grouper par catégorie
readonly groupedSuggestions = computed(() => {
  const groups: Record<string, Suggestion[]> = {};
  for (const s of this.suggestions()) {
    if (!groups[s.category]) groups[s.category] = [];
    groups[s.category].push(s);
  }
  return Object.entries(groups);
});

ngOnInit(): void {
  this.searchCtrl.valueChanges.pipe(
    debounceTime(300),
    distinctUntilChanged(),
    switchMap(q => {
      if (!q || q.length < 2) { this.suggestions.set([]); return of([]); }
      this.searching.set(true);
      return this.searchService.search(q).pipe(
        catchError(() => of([]))
      );
    }),
    takeUntilDestroyed(this.destroyRef)
  ).subscribe(results => {
    this.suggestions.set(results);
    this.searching.set(false);
  });
}

onSelect(suggestion: Suggestion): void {
  // Navigation selon la catégorie
  if (suggestion.category === 'Tickets')
    this.router.navigate(['/back-office/tickets', suggestion.id]);
  else if (suggestion.category === 'Éléments')
    this.router.navigate(['/front-office/items', suggestion.id]);
}
```

```html
<!-- Importer MatAutocompleteModule, ReactiveFormsModule, MatFormFieldModule -->
<mat-form-field class="search-field">
  <input matInput
         [formControl]="searchCtrl"
         [matAutocomplete]="auto"
         placeholder="Rechercher tickets, éléments, techniciens…" />
  @if (searching()) {
    <app-spinner matSuffix size="sm" />
  } @else {
    <i class="fa-solid fa-magnifying-glass" matSuffix></i>
  }
  <mat-autocomplete #auto="matAutocomplete" (optionSelected)="onSelect($event.option.value)">
    @for (group of groupedSuggestions(); track group[0]) {
      <!-- Groupe par catégorie -->
      <mat-optgroup [label]="group[0]">
        @for (s of group[1]; track s.id) {
          <mat-option [value]="s">
            {{ s.label }}
          </mat-option>
        }
      </mat-optgroup>
    }
    @if (!searching() && searchCtrl.value && suggestions().length === 0) {
      <mat-option disabled>Aucun résultat</mat-option>
    }
  </mat-autocomplete>
</mat-form-field>
```

---

## 4. Debounce + Annulation (Race Condition)

```typescript
// Pattern recommandé pour éviter les conditions de course
import { Subject, switchMap, debounceTime, distinctUntilChanged, catchError, of } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

private readonly search$ = new Subject<string>();

constructor(private destroyRef: DestroyRef) {
  this.search$.pipe(
    debounceTime(300),           // Attendre 300ms après le dernier keystroke
    distinctUntilChanged(),       // Ignorer si valeur identique
    switchMap(q => {              // Annuler la requête précédente
      if (!q.trim()) return of([]);
      return this.service.search(q).pipe(
        catchError(() => of([]))  // Ne pas casser le flux en cas d'erreur
      );
    }),
    takeUntilDestroyed(this.destroyRef) // Auto-unsubscribe
  ).subscribe(results => this.results.set(results));
}

onInput(q: string): void {
  this.search$.next(q);
}
```

```html
<app-search-input [(value)]="searchValue" (search)="onInput($event)" />
<!-- OU directement sur l'input -->
<input (input)="onInput($event.target.value)" />
```

**Pourquoi `switchMap` ?** Si l'utilisateur tape "ab" puis "abc", la requête pour "ab" est annulée automatiquement quand "abc" part. Sans `switchMap`, les deux requêtes arrivent et la plus lente peut écraser la plus récente (race condition).

---

## 5. Recherche Intelligente (Parsing de la Saisie)

```typescript
interface ParsedSearch {
  ticketId?: number;
  typeKeyword?: string;
  statusKeyword?: string;
  freeText?: string;
}

parseSearch(query: string): ParsedSearch {
  const result: ParsedSearch = {};

  // #1234 → numéro de ticket
  const ticketMatch = query.match(/#(\d+)/);
  if (ticketMatch) {
    result.ticketId = parseInt(ticketMatch[1]);
    query = query.replace(ticketMatch[0], '').trim();
  }

  // Mots-clés de statut
  const statusMap: Record<string, number> = {
    'ouvert': 1, 'nouveau': 1, 'vaovao': 1,
    'en cours': 2, 'efa manao': 2,
    'résolu': 5, 'vita': 5,
  };
  for (const [kw, code] of Object.entries(statusMap)) {
    if (query.toLowerCase().includes(kw)) {
      result.statusKeyword = kw;
      query = query.toLowerCase().replace(kw, '').trim();
      break;
    }
  }

  // Mots-clés de type (écran, ordinateur, imprimante…)
  const typeKeywords = ['écran', 'ordinateur', 'imprimante', 'réseau', 'logiciel'];
  for (const kw of typeKeywords) {
    if (query.toLowerCase().includes(kw)) {
      result.typeKeyword = kw;
      query = query.toLowerCase().replace(kw, '').trim();
      break;
    }
  }

  if (query.trim()) result.freeText = query.trim();
  return result;
}

// Utiliser dans le handler de recherche
onSearch(q: string): void {
  const parsed = this.parseSearch(q);
  this.parsedQuery.set(parsed);
  // Construire la requête API selon les critères
  this.buildApiQuery(parsed);
}
```

---

## 6. Filtres Favoris (Sauvegarde/Chargement)

```typescript
interface SavedFilter {
  id: string;
  name: string;
  criteria: {
    q?: string;
    type?: string | null;
    status?: number | null;
    from?: string;
    to?: string;
  };
  createdAt: string;
}

private readonly FAVORITES_KEY = 'search-favorites';
readonly favorites = signal<SavedFilter[]>([]);

ngOnInit(): void {
  const raw = localStorage.getItem(this.FAVORITES_KEY);
  if (raw) this.favorites.set(JSON.parse(raw));
}

private saveFavoritesToStorage(): void {
  localStorage.setItem(this.FAVORITES_KEY, JSON.stringify(this.favorites()));
}

saveCurrentAsFilter(name: string): void {
  const fav: SavedFilter = {
    id: Date.now().toString(),
    name,
    criteria: {
      q:      this.searchText() || undefined,
      type:   this.filterType() ?? undefined,
      status: this.filterStatus() ?? undefined,
      from:   this.filterDateFrom() || undefined,
      to:     this.filterDateTo() || undefined,
    },
    createdAt: new Date().toISOString(),
  };
  this.favorites.update(list => [...list, fav]);
  this.saveFavoritesToStorage();
  this.toast.success(`Filtre "${name}" sauvegardé`);
}

applyFilter(fav: SavedFilter): void {
  const c = fav.criteria;
  this.searchText.set(c.q ?? '');
  this.filterType.set(c.type ?? null);
  this.filterStatus.set(c.status ?? null);
  this.filterDateFrom.set(c.from ?? '');
  this.filterDateTo.set(c.to ?? '');
  this.toast.info(`Filtre "${fav.name}" appliqué`);
}

deleteFavorite(id: string): void {
  this.favorites.update(list => list.filter(f => f.id !== id));
  this.saveFavoritesToStorage();
}

// Signaux pour la modale de sauvegarde
readonly saveFilterOpen = signal(false);
readonly saveFilterName = signal('');

openSaveFilter(): void {
  this.saveFilterName.set('');
  this.saveFilterOpen.set(true);
}

confirmSaveFilter(): void {
  if (!this.saveFilterName().trim()) return;
  this.saveCurrentAsFilter(this.saveFilterName());
  this.saveFilterOpen.set(false);
}
```

```html
<!-- Bouton menu favoris -->
<button mat-stroked-button [matMenuTriggerFor]="favMenu">
  <i class="fa-solid fa-star"></i>
  Favoris ({{ favorites().length }})
</button>

<mat-menu #favMenu="matMenu">
  <button mat-menu-item (click)="openSaveFilter()">
    <i class="fa-solid fa-plus"></i> Sauvegarder comme favori
  </button>
  @if (favorites().length > 0) {
    <mat-divider />
    @for (fav of favorites(); track fav.id) {
      <button mat-menu-item (click)="applyFilter(fav)">
        <span class="fav-name">{{ fav.name }}</span>
        <button mat-icon-button (click)="$event.stopPropagation(); deleteFavorite(fav.id)"
                class="fav-delete" aria-label="Supprimer">
          <i class="fa-solid fa-trash fa-xs"></i>
        </button>
      </button>
    }
  } @else {
    <mat-menu-item disabled>Aucun favori sauvegardé</mat-menu-item>
  }
</mat-menu>

<!-- Modale de nommage -->
<app-modal [open]="saveFilterOpen()" title="Nommer ce filtre" size="sm"
           (closed)="saveFilterOpen.set(false)">
  <app-input label="Nom du filtre *" [(value)]="saveFilterName" />
  <div slot="footer">
    <button mat-button (click)="saveFilterOpen.set(false)">Annuler</button>
    <button mat-flat-button [disabled]="!saveFilterName().trim()" (click)="confirmSaveFilter()">
      Sauvegarder
    </button>
  </div>
</app-modal>
```

---

## 7. Partage via URL (Query Params)

```typescript
import { ActivatedRoute, Router } from '@angular/router';

private readonly route  = inject(ActivatedRoute);
private readonly router = inject(Router);

ngOnInit(): void {
  // Restaurer depuis les query params (partage URL)
  const params = this.route.snapshot.queryParams;
  if (params['q'])      this.searchText.set(params['q']);
  if (params['type'])   this.filterType.set(params['type']);
  if (params['status']) this.filterStatus.set(+params['status']);
  if (params['from'])   this.filterDateFrom.set(params['from']);
  if (params['to'])     this.filterDateTo.set(params['to']);
  // … charger données
}

// Mettre à jour l'URL sans navigation
updateUrl(): void {
  const queryParams: any = {};
  if (this.searchText())      queryParams['q']      = this.searchText();
  if (this.filterType())      queryParams['type']   = this.filterType();
  if (this.filterStatus() !== null) queryParams['status'] = this.filterStatus();
  if (this.filterDateFrom())  queryParams['from']   = this.filterDateFrom();
  if (this.filterDateTo())    queryParams['to']     = this.filterDateTo();

  this.router.navigate([], {
    relativeTo: this.route,
    queryParams,
    replaceUrl: true, // pas d'entrée dans l'historique
  });
}

// Copier l'URL filtrée
copyShareLink(): void {
  this.updateUrl();
  navigator.clipboard.writeText(window.location.href);
  this.toast.success('Lien copié !');
}
```

---

## 8. Pièges

| Symptôme | Cause | Solution |
|----------|-------|----------|
| Race condition (résultats dans le mauvais ordre) | `mergeMap` ou `concatMap` au lieu de `switchMap` | Toujours `switchMap` pour la recherche temps-réel |
| Autocomplétion déclenche une requête par keystroke | Pas de `debounceTime` | Ajouter `debounceTime(300)` avant `switchMap` |
| Chips ne disparaissent pas après clearAll | `activeChips` pas un `computed()` | Déclarer en `computed(() => [...])` dépendant des signaux de filtre |
| Favoris perdus après rechargement | Pas de `localStorage` | Utiliser `localStorage.setItem/getItem` |
| URL avec paramètres dupliqués | `navigate` sans `replaceUrl: true` | Ajouter `replaceUrl: true` dans les options |
| `MatAutocompleteModule` not found | Import manquant | Ajouter `MatAutocompleteModule` + `ReactiveFormsModule` dans `imports: []` |
| Suggestions restent après sélection | `formControl.value` = objet Suggestion | Implémenter `displayFn` sur `mat-autocomplete` : `[displayWith]="displayFn"` où `displayFn = (s) => s?.label ?? ''` |
