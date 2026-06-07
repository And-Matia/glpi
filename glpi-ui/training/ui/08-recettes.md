# 08 — Recettes UI : compositions complètes

Assemblages prêts à coller des composants `shared/ui`. Chaque recette = un squelette de page
type. Pour le **branchement aux services/GLPI**, voir `../docs/13-recettes-features.md`.

---

## Recette A — Page liste filtrable (recherche + filtres + table enrichie)
```ts
@Component({
  selector: 'app-x-list',
  imports: [
    PageHeaderComponent, SearchInputComponent, SelectComponent, SpinnerComponent,
    TableComponent, TableCellDirective, BadgeComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './x-list.component.html',
})
export class XListComponent implements OnInit {
  private readonly service = inject(XService);

  readonly loading = signal(true);
  readonly error   = signal('');
  readonly all     = signal<X[]>([]);
  readonly q       = signal('');
  readonly typeFilter = signal('');

  readonly columns: TableColumn[] = [
    { key: 'name',   label: 'Nom',    sortable: true },
    { key: 'type',   label: 'Type' },
    { key: 'status', label: 'Statut', width: '160px' },
  ];

  readonly rows = computed(() => {
    const t = this.q().toLowerCase().trim();
    const type = this.typeFilter();
    return this.all()
      .filter(x => (!type || x.type === type) &&
                   (!t || x.name.toLowerCase().includes(t)))
      .map(x => ({ name: x.name, type: x.type, status: x.status }));
  });

  ngOnInit() {
    this.service.getAll().subscribe({
      next: x => { this.all.set(x); this.loading.set(false); },
      error: () => { this.error.set('Chargement impossible.'); this.loading.set(false); },
    });
  }
}
```
```html
<div class="page">
  <app-page-header title="Éléments" subtitle="Parc informatique" />

  <div class="filters">
    <app-search-input placeholder="Rechercher…" [(value)]="q" />
    <app-select label="Type" [options]="typeOptions" [(value)]="typeFilter" />
  </div>

  @if (loading()) {
    <app-spinner size="lg" />
  } @else if (error()) {
    <p class="error">{{ error() }}</p>
  } @else {
    <app-table [columns]="columns" [rows]="rows()" [showToolbar]="false"
      emptyLabel="Aucun élément trouvé">
      <ng-template appCell="status" let-value="value">
        <app-badge [variant]="statusVariant(value)" size="sm">{{ value }}</app-badge>
      </ng-template>
    </app-table>
  }
</div>
```

---

## Recette B — Page de détail (fiche)
```html
<div class="page">
  <app-breadcrumb [items]="crumbs" />
  <app-page-header [title]="item().name" [subtitle]="assetLabel(item().item_type)">
    <app-button variant="ghost" (clicked)="edit()">Modifier</app-button>
    <app-button variant="danger" (clicked)="askDelete()">Supprimer</app-button>
  </app-page-header>

  @if (loading()) {
    <app-spinner size="lg" />
  } @else {
    <app-card title="Informations">
      <dl class="fiche">
        <dt>Statut</dt>      <dd><app-badge [variant]="statusVariant(item().status)">{{ item().status }}</app-badge></dd>
        <dt>Localisation</dt><dd>{{ item().location || '—' }}</dd>
        <dt>Utilisateur</dt> <dd>{{ item().user || '—' }}</dd>
      </dl>
    </app-card>
  }

  <app-confirm-dialog [open]="confirmOpen()" title="Supprimer ?" [danger]="true"
    (confirmed)="onConfirmed()" (cancelled)="confirmOpen.set(false)" />
</div>
```

---

## Recette C — Formulaire de création (page dédiée)
```html
<div class="page">
  <app-page-header title="Nouvel élément" />

  <app-card title="Détails">
    <div class="form">
      <app-input  label="Nom"  [(value)]="name"  [errorMessage]="nameError()" />
      <app-select label="Type" [options]="typeOptions" [(value)]="type" />
      <app-select label="Statut" [options]="statusOptions" [(value)]="status" />
      <app-input  label="N° inventaire" [(value)]="inventory" />
    </div>

    <div slot="header-actions"></div>
  </app-card>

  <div class="actions">
    <app-button variant="ghost" (clicked)="goBack()">Annuler</app-button>
    <app-button [loading]="submitting()" (clicked)="onSubmit()">Créer</app-button>
  </div>
</div>
```

---

## Recette D — CRUD avec modale (créer/éditer sans changer de page)
```ts
readonly modalOpen = signal(false);
readonly editingId = signal<number | null>(null);
readonly name      = signal('');

openCreate()      { this.editingId.set(null); this.name.set(''); this.modalOpen.set(true); }
openEdit(row: X)  { this.editingId.set(row.id); this.name.set(row.name); this.modalOpen.set(true); }

save() {
  const id = this.editingId();
  const op = id == null
    ? this.service.create({ name: this.name() })
    : this.service.update(id, { name: this.name() });
  op.subscribe(() => { this.modalOpen.set(false); this.reload(); });
}
```
```html
<app-page-header title="Catégories">
  <app-button (clicked)="openCreate()">Ajouter</app-button>
</app-page-header>

<app-table [columns]="columns" [rows]="rows()">
  <ng-template appCell="actions" let-row>
    <app-icon-button icon="fa-solid fa-pen" ariaLabel="Modifier" (clicked)="openEdit(row)" />
  </ng-template>
</app-table>

<app-modal [open]="modalOpen()" [title]="editingId() ? 'Modifier' : 'Ajouter'"
  (closed)="modalOpen.set(false)">
  <app-input label="Nom" [(value)]="name" />
  <div slot="footer">
    <app-button variant="ghost" (clicked)="modalOpen.set(false)">Annuler</app-button>
    <app-button (clicked)="save()">Enregistrer</app-button>
  </div>
</app-modal>
```

---

## Recette E — Dashboard (cartes d'indicateurs)
```html
<app-page-header title="Tableau de bord">
  <app-button variant="ghost" [loading]="loading()" (clicked)="load()">Rafraîchir</app-button>
</app-page-header>

<div class="stats-grid">
  <app-stat-card label="Tickets ouverts" [value]="openCount()" icon="fa-solid fa-ticket" variant="info" />
  <app-stat-card label="Éléments" [value]="itemCount()" icon="fa-solid fa-desktop" variant="primary" />
  <app-stat-card label="Coût total" [value]="totalCost() + ' €'" icon="fa-solid fa-euro-sign" variant="success" />
</div>
```
```css
.stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: var(--spacing-4); }
```

---

## Mémo CSS (toujours via tokens)
```css
.page    { display: flex; flex-direction: column; gap: var(--spacing-5); }
.filters { display: flex; gap: var(--spacing-4); align-items: flex-end; flex-wrap: wrap; }
.form    { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: var(--spacing-4); }
.actions { display: flex; gap: var(--spacing-3); justify-content: flex-end; }
```

> Règle : **l'espacement vient du parent** (flex/grid + `gap`), jamais de marges en dur dans les
> composants. Toutes les valeurs sont des tokens (`--spacing-*`, `--color-*`, `--radius-*`).
