# 08 — Recettes UI : compositions complètes

Assemblages prêts à coller des composants `shared/ui` + Material. Chaque recette = un squelette de
page type. Pour le **branchement aux services/GLPI**, voir `../docs/13-recettes-features.md`.

> Tous les exemples utilisent `async/await` + `firstValueFrom` (plus de `.subscribe()`).

---

## Recette A — Page liste filtrable (recherche + filtres + table enrichie)
```ts
@Component({
  selector: 'app-x-list',
  imports: [
    PageHeaderComponent, SearchInputComponent, SelectComponent, SpinnerComponent,
    TableComponent, TableCellDirective, BadgeComponent, MatButtonModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './x-list.component.html',
})
export class XListComponent implements OnInit {
  private readonly service = inject(XService);
  private readonly toast   = inject(ToastService);

  readonly loading    = signal(true);
  readonly error      = signal('');
  readonly all        = signal<X[]>([]);
  readonly q          = signal('');
  readonly typeFilter = signal('');

  readonly columns: TableColumn[] = [
    { key: 'name',   label: 'Nom',    sortable: true },
    { key: 'type',   label: 'Type' },
    { key: 'status', label: 'Statut', width: '160px' },
    { key: 'actions', label: '',       width: '80px' },
  ];

  readonly rows = computed(() => {
    const t    = this.q().toLowerCase().trim();
    const type = this.typeFilter();
    return this.all()
      .filter(x => (!type || x.type === type) &&
                   (!t    || x.name.toLowerCase().includes(t)))
      .map(x => ({ id: x.id, name: x.name, type: x.type, status: x.status }));
  });

  async ngOnInit(): Promise<void> {
    try {
      this.all.set(await this.service.getAll());
    } catch {
      this.error.set('Chargement impossible.');
    } finally {
      this.loading.set(false);
    }
  }
}
```
```html
<div class="page">
  <app-page-header title="Éléments" subtitle="Parc informatique">
    <button mat-flat-button routerLink="create">Ajouter</button>
  </app-page-header>

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
      <ng-template appCell="actions" let-row>
        <button mat-icon-button aria-label="Voir" [routerLink]="[row.id]">
          <i class="fa-solid fa-eye"></i>
        </button>
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
    <button mat-button (click)="edit()">Modifier</button>
    <button mat-flat-button color="warn" (click)="askDelete()">Supprimer</button>
  </app-page-header>

  @if (loading()) {
    <app-spinner size="lg" />
  } @else {
    <mat-card>
      <mat-card-header><mat-card-title>Informations</mat-card-title></mat-card-header>
      <mat-card-content>
        <dl class="fiche">
          <dt>Statut</dt>      <dd><app-badge [variant]="statusVariant(item().status)">{{ item().status }}</app-badge></dd>
          <dt>Localisation</dt><dd>{{ item().location || '—' }}</dd>
          <dt>Utilisateur</dt> <dd>{{ item().user || '—' }}</dd>
        </dl>
      </mat-card-content>
    </mat-card>
  }

  <app-confirm-dialog [open]="confirmOpen()" title="Supprimer ?" [danger]="true"
    (confirmed)="onConfirmed()" (cancelled)="confirmOpen.set(false)" />
</div>
```

---

## Recette C — Formulaire de création (page dédiée)
```ts
readonly name      = signal('');
readonly type      = signal<string | null>(null);
readonly submitted = signal(false);
readonly submitting = signal(false);

readonly nameError = computed(() =>
  this.submitted() && !this.name().trim() ? 'Nom obligatoire' : '');

async onSubmit(): Promise<void> {
  this.submitted.set(true);
  if (!this.name().trim() || !this.type()) {
    this.toast.warning('Veuillez remplir les champs obligatoires.');
    return;
  }
  this.submitting.set(true);
  try {
    await this.service.create({ name: this.name(), type: this.type()! });
    this.toast.success('Créé avec succès !');
    this.router.navigate(['..']);
  } catch {
    this.toast.error('Erreur lors de la création.');
  } finally {
    this.submitting.set(false);
  }
}
```
```html
<div class="page">
  <app-page-header title="Nouvel élément" />

  <mat-card>
    <mat-card-header><mat-card-title>Détails</mat-card-title></mat-card-header>
    <mat-card-content>
      <div class="form">
        <app-input  label="Nom"    [(value)]="name"   [errorMessage]="nameError()" />
        <app-select label="Type"   [options]="typeOptions"   [(value)]="type" />
        <app-select label="Statut" [options]="statusOptions" [(value)]="status" />
        <app-input  label="N° inventaire" [(value)]="inventory" />
      </div>
    </mat-card-content>
  </mat-card>

  <div class="actions">
    <button mat-button routerLink="..">Annuler</button>
    <button mat-flat-button [disabled]="submitting()" (click)="onSubmit()">
      {{ submitting() ? 'Création…' : 'Créer' }}
    </button>
  </div>
</div>
```

---

## Recette D — CRUD avec modale (créer/éditer sans changer de page)
```ts
readonly modalOpen = signal(false);
readonly saving    = signal(false);
readonly editingId = signal<number | null>(null);
readonly name      = signal('');

openCreate()     { this.editingId.set(null); this.name.set(''); this.modalOpen.set(true); }
openEdit(row: X) { this.editingId.set(row.id); this.name.set(row.name); this.modalOpen.set(true); }

async save(): Promise<void> {
  this.saving.set(true);
  const id = this.editingId();
  try {
    if (id == null) {
      await this.service.create({ name: this.name() });
    } else {
      await this.service.update(id, { name: this.name() });
    }
    this.toast.success(id == null ? 'Créé !' : 'Modifié !');
    this.modalOpen.set(false);
    await this.reload();
  } catch {
    this.toast.error('Erreur lors de l\'enregistrement.');
  } finally {
    this.saving.set(false);
  }
}
```
```html
<app-page-header title="Catégories">
  <button mat-flat-button (click)="openCreate()">Ajouter</button>
</app-page-header>

<app-table [columns]="columns" [rows]="rows()">
  <ng-template appCell="actions" let-row>
    <button mat-icon-button aria-label="Modifier" (click)="openEdit(row)">
      <i class="fa-solid fa-pen"></i>
    </button>
  </ng-template>
</app-table>

<app-modal [open]="modalOpen()" [title]="editingId() ? 'Modifier' : 'Ajouter'"
  (closed)="modalOpen.set(false)">
  <app-input label="Nom" [(value)]="name" />
  <div slot="footer">
    <button mat-button (click)="modalOpen.set(false)">Annuler</button>
    <button mat-flat-button [disabled]="saving()" (click)="save()">
      {{ saving() ? 'Enregistrement…' : 'Enregistrer' }}
    </button>
  </div>
</app-modal>
```

---

## Recette E — Dashboard (cartes d'indicateurs)
```ts
async ngOnInit(): Promise<void> {
  try {
    const stats = await this.statsService.getDashboard();
    this.openCount.set(stats.openTickets);
    this.itemCount.set(stats.items);
    this.totalCost.set(stats.totalCost);
  } catch {
    this.toast.error('Impossible de charger le tableau de bord.');
  } finally {
    this.loading.set(false);
  }
}
```
```html
<app-page-header title="Tableau de bord">
  <button mat-button [disabled]="loading()" (click)="ngOnInit()">Rafraîchir</button>
</app-page-header>

@if (loading()) {
  <div class="stats-grid">
    @for (_ of [1,2,3]; track $index) { <app-skeleton height="120px" /> }
  </div>
} @else {
  <div class="stats-grid">
    <app-stat-card label="Tickets ouverts" [value]="openCount()" icon="fa-solid fa-ticket" variant="info" />
    <app-stat-card label="Éléments" [value]="itemCount()" icon="fa-solid fa-desktop" variant="primary" />
    <app-stat-card label="Coût total" [value]="totalCost() + ' €'" icon="fa-solid fa-euro-sign" variant="success" />
  </div>
}
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
