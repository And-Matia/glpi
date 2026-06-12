# 12 — Tableaux Avancés

> Tri multi-colonnes, colonnes masquables, lignes extensibles, en-tête figé, regroupement, multi-sélection, actions groupées, export filtré.

---

## 1. Tri Multi-Colonnes avec app-table

`app-table` gère le tri colonne par colonne. Pour le multi-colonnes, implémenter manuellement.

```typescript
interface SortConfig { key: string; dir: 'asc' | 'desc'; }

readonly sortStack = signal<SortConfig[]>([]); // tri prioritaire = index 0

addSort(key: string): void {
  this.sortStack.update(stack => {
    const existing = stack.find(s => s.key === key);
    if (existing) {
      // Inverser la direction, ou retirer si déjà desc
      if (existing.dir === 'asc')
        return stack.map(s => s.key === key ? { ...s, dir: 'desc' as const } : s);
      return stack.filter(s => s.key !== key); // retirer
    }
    return [...stack, { key, dir: 'asc' as const }];
  });
}

readonly sortedRows = computed(() => {
  const rows = [...this.rows()];
  const stack = this.sortStack();
  if (stack.length === 0) return rows;

  return rows.sort((a, b) => {
    for (const { key, dir } of stack) {
      const va = a[key] ?? '';
      const vb = b[key] ?? '';
      const cmp = String(va).localeCompare(String(vb), 'fr', { numeric: true });
      if (cmp !== 0) return dir === 'asc' ? cmp : -cmp;
    }
    return 0;
  });
});
```

```html
<!-- En-têtes cliquables avec indicateur de tri -->
<table class="custom-table">
  <thead>
    <tr>
      @for (col of columns; track col.key) {
        <th (click)="addSort(col.key)" class="sortable-header">
          {{ col.label }}
          @if (getSortIndex(col.key) >= 0) {
            <span class="sort-indicator">
              {{ getSortDir(col.key) === 'asc' ? '↑' : '↓' }}
              <sup>{{ getSortIndex(col.key) + 1 }}</sup>
            </span>
          }
        </th>
      }
    </tr>
  </thead>
</table>
```

```typescript
getSortIndex(key: string): number {
  return this.sortStack().findIndex(s => s.key === key);
}
getSortDir(key: string): 'asc' | 'desc' {
  return this.sortStack().find(s => s.key === key)?.dir ?? 'asc';
}
```

---

## 2. Colonnes Masquables via Menu

```typescript
readonly columns: TableColumn[] = [
  { key: 'name',      label: 'Nom',      sortable: true },
  { key: 'type',      label: 'Type',     sortable: true },
  { key: 'status',    label: 'Statut' },
  { key: 'location',  label: 'Lieu' },
  { key: 'assignee',  label: 'Assigné' },
];

readonly hiddenCols = signal<Set<string>>(new Set());

readonly visibleColumns = computed(() =>
  this.columns.filter(c => !this.hiddenCols().has(c.key))
);

toggleColumn(key: string): void {
  this.hiddenCols.update(set => {
    const next = new Set(set);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    return next;
  });
}

isVisible(key: string): boolean {
  return !this.hiddenCols().has(key);
}
```

```html
<!-- Bouton d'ouverture du menu -->
<button mat-icon-button [matMenuTriggerFor]="colMenu" aria-label="Colonnes visibles"
        matTooltip="Afficher/masquer colonnes">
  <i class="fa-solid fa-table-columns"></i>
</button>

<mat-menu #colMenu="matMenu">
  @for (col of columns; track col.key) {
    <mat-menu-item (click)="toggleColumn(col.key)">
      <mat-checkbox [checked]="isVisible(col.key)" (click)="$event.stopPropagation()">
        {{ col.label }}
      </mat-checkbox>
    </mat-menu-item>
  }
</mat-menu>

<!-- Table avec colonnes filtrées -->
<app-table [columns]="visibleColumns()" [rows]="rows()" />
```

```typescript
// Importer :
imports: [MatMenuModule, MatCheckboxModule, MatButtonModule, MatTooltipModule]
```

---

## 3. Pagination Configurable

```typescript
readonly pageSize  = signal(25);
readonly pageIndex = signal(0);

readonly pageSizeOptions = [10, 25, 50];

readonly pageCount = computed(() =>
  Math.ceil(this.filteredRows().length / this.pageSize())
);

readonly pagedRows = computed(() => {
  const start = this.pageIndex() * this.pageSize();
  return this.filteredRows().slice(start, start + this.pageSize());
});

onPageChange(event: PageEvent): void {
  this.pageIndex.set(event.pageIndex);
  this.pageSize.set(event.pageSize);
}
```

```html
<app-table [columns]="visibleColumns()" [rows]="pagedRows()" />

<mat-paginator
  [length]="filteredRows().length"
  [pageSize]="pageSize()"
  [pageSizeOptions]="pageSizeOptions"
  [pageIndex]="pageIndex()"
  (page)="onPageChange($event)"
  showFirstLastButtons
/>
```

```typescript
imports: [MatPaginatorModule]
// Interface :
import { PageEvent } from '@angular/material/paginator';
```

---

## 4. Multi-Sélection + Actions Groupées

```typescript
readonly selectedIds = signal<Set<number>>(new Set());

readonly allSelected = computed(() =>
  this.pagedRows().length > 0 &&
  this.pagedRows().every(r => this.selectedIds().has(r.id))
);

readonly indeterminate = computed(() =>
  !this.allSelected() && this.pagedRows().some(r => this.selectedIds().has(r.id))
);

toggleRow(id: number): void {
  this.selectedIds.update(set => {
    const next = new Set(set);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    return next;
  });
}

toggleAll(): void {
  if (this.allSelected()) {
    this.selectedIds.set(new Set());
  } else {
    this.selectedIds.set(new Set(this.pagedRows().map(r => r.id)));
  }
}

clearSelection(): void {
  this.selectedIds.set(new Set());
}

// Actions groupées
readonly bulkLoading = signal(false);
readonly bulkReport  = signal<{ success: number; failed: number } | null>(null);

async bulkDelete(): Promise<void> {
  this.bulkLoading.set(true);
  let success = 0, failed = 0;
  for (const id of this.selectedIds()) {
    try {
      await this.service.delete(id);
      success++;
    } catch {
      failed++;
    }
  }
  this.bulkReport.set({ success, failed });
  this.clearSelection();
  await this.reload();
  this.bulkLoading.set(false);
}
```

```html
<!-- Barre d'actions groupées (visible si sélection) -->
@if (selectedIds().size > 0) {
  <div class="bulk-bar">
    <span>{{ selectedIds().size }} sélectionné(s)</span>
    <button mat-button (click)="clearSelection()">Désélectionner tout</button>
    <button mat-flat-button color="warn" [disabled]="bulkLoading()"
            (click)="confirmOpen.set(true)">
      Supprimer la sélection
    </button>
  </div>
}

<!-- En-tête du tableau avec checkbox "tout sélectionner" -->
<table>
  <thead>
    <tr>
      <th>
        <mat-checkbox
          [checked]="allSelected()"
          [indeterminate]="indeterminate()"
          (change)="toggleAll()"
          aria-label="Tout sélectionner"
        />
      </th>
      @for (col of visibleColumns(); track col.key) {
        <th>{{ col.label }}</th>
      }
    </tr>
  </thead>
  <tbody>
    @for (row of pagedRows(); track row.id) {
      <tr [class.selected]="selectedIds().has(row.id)">
        <td>
          <mat-checkbox
            [checked]="selectedIds().has(row.id)"
            (change)="toggleRow(row.id)"
          />
        </td>
        @for (col of visibleColumns(); track col.key) {
          <td>{{ row[col.key] }}</td>
        }
      </tr>
    }
  </tbody>
</table>

<!-- Confirmation suppression groupée -->
<app-confirm-dialog
  [open]="confirmOpen()"
  title="Supprimer {{ selectedIds().size }} élément(s)"
  message="Cette action est irréversible."
  [danger]="true"
  (confirmed)="confirmOpen.set(false); bulkDelete()"
  (cancelled)="confirmOpen.set(false)"
/>

<!-- Rapport résultat -->
@if (bulkReport()) {
  <app-alert [variant]="bulkReport()!.failed > 0 ? 'warning' : 'success'"
             [title]="bulkReport()!.success + ' succès, ' + bulkReport()!.failed + ' échec(s)'"
             [dismissible]="true"
             (dismissed)="bulkReport.set(null)" />
}
```

---

## 5. Lignes Extensibles (Accordéon)

```typescript
readonly expandedIds = signal<Set<number>>(new Set());

toggleExpand(id: number): void {
  this.expandedIds.update(set => {
    const next = new Set(set);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    return next;
  });
}

isExpanded(id: number): boolean {
  return this.expandedIds().has(id);
}
```

```html
<table class="expandable-table">
  <tbody>
    @for (row of rows(); track row.id) {
      <!-- Ligne principale -->
      <tr class="expandable-table__row" (click)="toggleExpand(row.id)">
        <td class="expand-toggle">
          <i [class]="isExpanded(row.id)
               ? 'fa-solid fa-chevron-down'
               : 'fa-solid fa-chevron-right'"></i>
        </td>
        <td>{{ row.ref_ticket }}</td>
        <td>{{ row.titre }}</td>
        <td>
          <app-badge [variant]="statusVariant(row.status)" size="sm">
            {{ statusLabel(row.status) }}
          </app-badge>
        </td>
      </tr>

      <!-- Ligne expandée -->
      @if (isExpanded(row.id)) {
        <tr class="expandable-table__detail">
          <td colspan="4">
            <div class="detail-panel">
              <p><strong>Description :</strong> {{ row.description }}</p>
              @if (row.items?.length) {
                <p><strong>Éléments liés :</strong>
                  @for (item of row.items; track item) { <span class="item-tag">{{ item }}</span> }
                </p>
              }
            </div>
          </td>
        </tr>
      }
    }
  </tbody>
</table>
```

```css
.expandable-table__row { cursor: pointer; }
.expandable-table__row:hover { background: var(--color-surface); }
.expandable-table__row.expanded { background: var(--color-surface); }

.expandable-table__detail td {
  padding: 0;
  border-bottom: 1px solid var(--color-border);
}
.detail-panel {
  padding: var(--spacing-3) var(--spacing-6);
  background: var(--color-surface);
  animation: slideDown 0.15s ease;
}
@keyframes slideDown {
  from { opacity: 0; transform: translateY(-4px); }
  to   { opacity: 1; transform: translateY(0); }
}
.item-tag {
  display: inline-block;
  background: var(--color-primary);
  border-radius: var(--radius-4);
  padding: 2px var(--spacing-2);
  font-size: var(--text-12);
  margin: 2px;
}
```

---

## 6. En-Tête Figé (Sticky Header)

```html
<!-- Conteneur avec overflow -->
<div class="table-scroll-container">
  <table class="sticky-table">
    <thead class="sticky-thead">
      <tr>
        @for (col of columns; track col.key) {
          <th>{{ col.label }}</th>
        }
      </tr>
    </thead>
    <tbody>
      @for (row of rows(); track row.id) {
        <tr>@for (col of columns; track col.key) { <td>{{ row[col.key] }}</td> }</tr>
      }
    </tbody>
  </table>
</div>
```

```css
.table-scroll-container {
  overflow-y: auto;
  max-height: calc(100vh - 300px);
}
.sticky-table { width: 100%; border-collapse: collapse; }
.sticky-thead th {
  position: sticky;
  top: 0;
  z-index: 1;
  background: white;
  border-bottom: 2px solid var(--color-border);
  padding: var(--spacing-3) var(--spacing-4);
  font-weight: var(--weight-semibold);
  text-align: left;
}
```

---

## 7. Regroupement par Catégorie (En-tête Repliable)

```typescript
interface GroupedRows { key: string; label: string; rows: any[]; expanded: boolean; }

readonly collapsedGroups = signal<Set<string>>(new Set());

readonly groupedData = computed(() => {
  const map = new Map<string, any[]>();
  for (const row of this.filteredRows()) {
    const key = row.category ?? 'Sans catégorie';
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(row);
  }
  return [...map.entries()].map(([key, rows]) => ({ key, rows }));
});

toggleGroup(key: string): void {
  this.collapsedGroups.update(set => {
    const next = new Set(set);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    return next;
  });
}

isGroupCollapsed(key: string): boolean {
  return this.collapsedGroups().has(key);
}
```

```html
<table>
  <thead>
    <tr>@for (col of columns; track col.key) { <th>{{ col.label }}</th> }</tr>
  </thead>
  <tbody>
    @for (group of groupedData(); track group.key) {
      <!-- En-tête de groupe repliable -->
      <tr class="group-header" (click)="toggleGroup(group.key)">
        <td [attr.colspan]="columns.length">
          <i [class]="isGroupCollapsed(group.key)
               ? 'fa-solid fa-chevron-right'
               : 'fa-solid fa-chevron-down'"></i>
          <strong>{{ group.key }}</strong>
          <app-badge variant="neutral" size="sm">{{ group.rows.length }}</app-badge>
        </td>
      </tr>

      <!-- Lignes du groupe -->
      @if (!isGroupCollapsed(group.key)) {
        @for (row of group.rows; track row.id) {
          <tr>
            @for (col of columns; track col.key) {
              <td>{{ row[col.key] }}</td>
            }
          </tr>
        }
      }
    }
  </tbody>
</table>
```

---

## 8. Export Filtré (CSV + JSON)

```typescript
exportCsv(): void {
  const rows = this.sortedRows(); // Données telles qu'affichées (filtrées + triées)
  const cols = this.visibleColumns();

  const header = cols.map(c => c.label).join(',');
  const body = rows.map(row =>
    cols.map(c => {
      const val = row[c.key] ?? '';
      const str = String(val).replace(/"/g, '""'); // échapper les guillemets
      return `"${str}"`;
    }).join(',')
  ).join('\n');

  this.downloadFile(`${header}\n${body}`, 'export.csv', 'text/csv;charset=utf-8;');
}

exportJson(): void {
  const rows = this.sortedRows();
  const cols = this.visibleColumns();

  const data = rows.map(row =>
    Object.fromEntries(cols.map(c => [c.key, row[c.key] ?? null]))
  );

  this.downloadFile(JSON.stringify(data, null, 2), 'export.json', 'application/json');
}

private downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
```

```html
<button mat-stroked-button [matMenuTriggerFor]="exportMenu">
  <i class="fa-solid fa-download"></i> Exporter
</button>
<mat-menu #exportMenu="matMenu">
  <button mat-menu-item (click)="exportCsv()">CSV</button>
  <button mat-menu-item (click)="exportJson()">JSON</button>
</mat-menu>
```

---

## 9. Colonnes Calculées dans l'Export

```typescript
// Ajouter des colonnes calculées aux données avant export
private enrichRow(row: any): any {
  const created = new Date(row.date_creation);
  const now = new Date();
  const ageDays = Math.floor((now.getTime() - created.getTime()) / 86_400_000);
  return {
    ...row,
    age_jours: ageDays,
    en_retard: ageDays > 7 && row.status !== STATUS_RESOLVED ? 'Oui' : 'Non',
  };
}

exportCsv(): void {
  const enriched = this.sortedRows().map(r => this.enrichRow(r));
  // … même logique
}
```

---

## 10. Pièges

| Symptôme | Cause | Solution |
|----------|-------|----------|
| Checkbox "tout sélectionner" pas réactive | `allSelected` pas un `computed()` | Déclarer en `computed(() => ...)` pas en méthode |
| Export contient les données non filtrées | Export sur `this.rows()` au lieu de `this.filteredRows()` | Toujours exporter depuis la source de données affichée |
| En-tête sticky disparaît au scroll | Pas de `position: sticky` + `top: 0` | Ajouter les deux règles CSS sur le `<thead>` |
| Accordéon : toutes les lignes s'expandent | `expandedIds` contient l'ID mais `track` incorrect | Utiliser un `Set` pour `expandedIds`, vérifier `has(id)` |
| Multi-sélection perd les IDs en changeant de page | `selectedIds` réinitialisé sur changement de page | Garder `selectedIds` indépendant de `pageIndex` |
| MatMenuModule introuvable | Module pas importé | `imports: [MatMenuModule]` dans le composant |
| Export CSV caractères spéciaux corrompus | Encodage UTF-8 sans BOM | Ajouter BOM : `new Blob(['﻿' + content], ...)` |
