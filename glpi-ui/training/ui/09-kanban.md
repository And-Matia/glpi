# 09 — Kanban (CDK Drag & Drop)

>  Toutes les variantes du Kanban : base, transitions conditionnelles, WIP limits, densité, filtre technicien, swimlanes.

---

## Setup & Imports

```typescript
import { DragDropModule, CdkDragDrop } from '@angular/cdk/drag-drop';

@Component({
  imports: [DragDropModule, /* autres */],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
```

---

## 1. Structure de Base (3 colonnes)

### Composant TypeScript

```typescript
export class KanbanComponent implements OnInit {
  private readonly ticketService = inject(TicketService);
  private readonly toast = inject(ToastService);

  readonly columns = [
    { id: 1, label: 'Nouveau',  code: 'new' },
    { id: 2, label: 'En cours', code: 'in-progress' },
    { id: 5, label: 'Résolu',   code: 'resolved' },
  ];

  readonly loading = signal(true);
  readonly tickets = signal<Ticket[]>([]);

  // Calculé (pas de méthode si possible)
  readonly connectedLists = this.columns.map(c => 'col-' + c.id);

  ticketsForColumn(statusId: number): Ticket[] {
    return this.tickets().filter(t => t.status === statusId);
  }

  async ngOnInit(): Promise<void> {
    try {
      this.tickets.set(await this.ticketService.getAll());
    } finally {
      this.loading.set(false);
    }
  }

  onDrop(event: CdkDragDrop<Ticket[]>, toStatusId: number): void {
    if (event.previousContainer === event.container) return; // même colonne
    const ticket = event.item.data as Ticket;
    this.moveTicket(ticket, toStatusId);
  }

  private moveTicket(ticket: Ticket, newStatus: number): void {
    // Mise à jour optimiste (UI immédiate)
    this.tickets.update(list =>
      list.map(t => t.id === ticket.id ? { ...t, status: newStatus } : t)
    );
    // API en arrière-plan + rollback si erreur
    this.ticketService.updateStatus(ticket.id, newStatus).catch(() => {
      this.tickets.update(list =>
        list.map(t => t.id === ticket.id ? { ...t, status: ticket.status } : t)
      );
      this.toast.error('Impossible de déplacer le ticket');
    });
  }
}
```

### Template HTML

```html
@if (loading()) {
  <app-spinner size="lg" />
} @else {
  <div cdkDropListGroup class="kanban-board">
    @for (col of columns; track col.id) {
      <div class="kanban-col">
        <!-- En-tête colonne -->
        <div class="kanban-col__header">
          <span>{{ col.label }}</span>
          <app-badge variant="neutral">{{ ticketsForColumn(col.id).length }}</app-badge>
        </div>

        <!-- Zone droppable -->
        <div
          cdkDropList
          [id]="'col-' + col.id"
          [cdkDropListData]="ticketsForColumn(col.id)"
          [cdkDropListConnectedTo]="connectedLists"
          (cdkDropListDropped)="onDrop($event, col.id)"
          class="kanban-col__body"
        >
          @for (ticket of ticketsForColumn(col.id); track ticket.id) {
            <div cdkDrag [cdkDragData]="ticket" class="kanban-card">
              <span class="kanban-card__title">{{ ticket.titre }}</span>
              <app-badge [variant]="priorityVariant(ticket.priority)" size="sm">
                {{ priorityLabel(ticket.priority) }}
              </app-badge>
            </div>
          }
          @empty {
            <div class="kanban-col__empty">Aucun ticket</div>
          }
        </div>
      </div>
    }
  </div>
}
```

---

## 2. Transition avec Modale (récupérer données avant de bouger)

Quand glisser vers « Résolu » → exiger une solution. Quand vers « En cours » → exiger un assigné.

```typescript
// Signaux pour les modales
readonly solutionOpen  = signal(false);
readonly solutionText  = signal('');
readonly solutionSaving = signal(false);

readonly assignOpen   = signal(false);
readonly assigneeId   = signal('');
readonly assignSaving = signal(false);

// Ticket en attente de confirmation
private readonly pendingTicket = signal<Ticket | null>(null);
private readonly pendingStatus = signal<number | null>(null);

onDrop(event: CdkDragDrop<Ticket[]>, toStatusId: number): void {
  if (event.previousContainer === event.container) return;
  const ticket = event.item.data as Ticket;

  if (toStatusId === 5 /* Résolu */) {
    this.pendingTicket.set(ticket);
    this.pendingStatus.set(toStatusId);
    this.solutionText.set('');
    this.solutionOpen.set(true);
    // La carte NE BOUGE PAS encore
  } else if (toStatusId === 2 && ticket.status === 1) {
    this.pendingTicket.set(ticket);
    this.assignOpen.set(true);
  } else {
    this.moveTicket(ticket, toStatusId);
  }
}

async confirmSolution(): Promise<void> {
  if (!this.solutionText().trim()) return;
  this.solutionSaving.set(true);
  try {
    await this.ticketService.postSolution(
      this.pendingTicket()!.id,
      this.solutionText()
    );
    this.moveTicket(this.pendingTicket()!, this.pendingStatus()!);
    this.solutionOpen.set(false);
  } catch {
    this.toast.error('Erreur lors de la résolution');
  } finally {
    this.solutionSaving.set(false);
  }
}

cancelSolution(): void {
  this.solutionOpen.set(false);
  this.pendingTicket.set(null);
  // La carte revient automatiquement (signal non modifié)
}
```

```html
<!-- Modale solution -->
<app-modal [open]="solutionOpen()" title="Saisir une solution" (closed)="cancelSolution()">
  <app-textarea label="Solution *" [(value)]="solutionText" [rows]="4" />
  <div slot="footer">
    <button mat-button (click)="cancelSolution()">Annuler</button>
    <button mat-flat-button
            [disabled]="!solutionText().trim() || solutionSaving()"
            (click)="confirmSolution()">
      {{ solutionSaving() ? 'Enregistrement…' : 'Confirmer' }}
    </button>
  </div>
</app-modal>
```

---

## 3. Workflow — Transitions Autorisées

```typescript
// Matrice des transitions valides
private readonly ALLOWED: Record<number, number[]> = {
  1: [2],     // Nouveau → En cours uniquement
  2: [5, 1],  // En cours → Résolu ou retour Nouveau
  5: [],      // Résolu → bloqué
};

canTransition(from: number, to: number): boolean {
  return this.ALLOWED[from]?.includes(to) ?? false;
}

onDrop(event: CdkDragDrop<Ticket[]>, toStatusId: number): void {
  if (event.previousContainer === event.container) return;
  const ticket = event.item.data as Ticket;

  if (!this.canTransition(ticket.status, toStatusId)) {
    this.toast.warning(`Transition ${ticket.status} → ${toStatusId} non autorisée`);
    return; // carte revient à sa place (signal non modifié)
  }
  this.moveTicket(ticket, toStatusId);
}
```

---

## 4. WIP Limits (limite par colonne)

```typescript
// Charger depuis SQLite ou hard-coder
readonly wipLimits = signal<Record<number, number>>({ 1: 10, 2: 5, 5: 20 });

// 'ok' | 'warning' | 'full'
getWipStatus(colId: number): string {
  const limit = this.wipLimits()[colId];
  if (!limit) return 'ok';
  const count = this.ticketsForColumn(colId).length;
  if (count / limit >= 1) return 'full';
  if (count / limit >= 0.8) return 'warning';
  return 'ok';
}

onDrop(event: CdkDragDrop<Ticket[]>, toStatusId: number): void {
  if (event.previousContainer === event.container) return;
  const ticket = event.item.data as Ticket;
  const limit = this.wipLimits()[toStatusId];

  if (limit && this.ticketsForColumn(toStatusId).length >= limit) {
    this.toast.error(`Colonne pleine ! Limite: ${limit} ticket(s)`);
    return;
  }
  this.moveTicket(ticket, toStatusId);
}
```

```html
<!-- En-tête colonne avec WIP -->
<div class="kanban-col__header" [class]="'wip-' + getWipStatus(col.id)">
  <span>{{ col.label }}</span>
  <span class="kanban-col__count">
    {{ ticketsForColumn(col.id).length }}
    @if (wipLimits()[col.id]) { / {{ wipLimits()[col.id] }} }
  </span>
</div>
```

```css
.kanban-col__header.wip-warning { background: var(--color-warning-bg); }
.kanban-col__header.wip-full    { background: var(--color-danger-bg); color: var(--color-danger); }
```

---

## 5. Sélecteur de Densité (mémorisé)

```typescript
type Density = 'compact' | 'normal' | 'detailed';
readonly density = signal<Density>('normal');

ngOnInit() {
  const saved = localStorage.getItem('kanban-density') as Density;
  if (saved) this.density.set(saved);
  // … charger tickets
}

setDensity(d: Density): void {
  this.density.set(d);
  localStorage.setItem('kanban-density', d);
}
```

```html
<!-- Sélecteur (au-dessus du kanban) -->
<div class="density-bar">
  @for (opt of [{v:'compact',l:'Compact'},{v:'normal',l:'Normal'},{v:'detailed',l:'Détaillé'}]; track opt.v) {
    <button mat-stroked-button
            [class.active]="density() === opt.v"
            (click)="setDensity(opt.v)">
      {{ opt.l }}
    </button>
  }
</div>

<!-- Carte avec densité -->
<div cdkDrag [cdkDragData]="ticket" class="kanban-card" [attr.data-density]="density()">
  <!-- Compact : titre seul -->
  <span class="kanban-card__title">{{ ticket.titre }}</span>

  <!-- Normal et Détaillé : + statut + technicien -->
  @if (density() !== 'compact') {
    <div class="kanban-card__meta">
      <app-badge [variant]="statusVariant(ticket.status)" size="sm">{{ ticket.status }}</app-badge>
      <span class="kanban-card__tech">{{ ticket.technicien }}</span>
    </div>
  }

  <!-- Détaillé seulement : description tronquée + date -->
  @if (density() === 'detailed') {
    <p class="kanban-card__desc">{{ ticket.description.slice(0, 80) }}…</p>
    <span class="kanban-card__date">{{ ticket.date }}</span>
  }
</div>
```

---

## 6. Filtre par Technicien (opacité, multi-sélection)

```typescript
readonly selectedTechs = signal<number[]>([]); // vide = tous visibles

readonly techniciens = computed(() =>
  [...new Map(this.tickets().filter(t => t.technicienId)
    .map(t => [t.technicienId, { id: t.technicienId!, name: t.technicien }]))
    .values()]
);

readonly visibleCount = computed(() =>
  this.selectedTechs().length === 0
    ? this.tickets().length
    : this.tickets().filter(t => this.selectedTechs().includes(t.technicienId ?? -1)).length
);

isCardVisible(ticket: Ticket): boolean {
  return this.selectedTechs().length === 0 ||
    this.selectedTechs().includes(ticket.technicienId ?? -1);
}

toggleTech(id: number): void {
  this.selectedTechs.update(list =>
    list.includes(id) ? list.filter(i => i !== id) : [...list, id]
  );
}
```

```html
<!-- Barre de filtre techniciens -->
<div class="tech-filter">
  <span class="tech-filter__count">{{ visibleCount() }} ticket(s)</span>
  @for (tech of techniciens(); track tech.id) {
    <div
      class="tech-avatar-btn"
      [class.selected]="selectedTechs().includes(tech.id)"
      (click)="toggleTech(tech.id)"
      [matTooltip]="tech.name"
    >
      <app-avatar [name]="tech.name" size="sm" />
    </div>
  }
  @if (selectedTechs().length > 0) {
    <button mat-button (click)="selectedTechs.set([])">Effacer</button>
  }
</div>

<!-- Carte avec opacité -->
<div cdkDrag [cdkDragData]="ticket" class="kanban-card"
     [style.opacity]="isCardVisible(ticket) ? 1 : 0.3"
     [style.transition]="'opacity 0.2s'">
```

---

## 7. Swim Lanes (Priorité × Statut)

```typescript
readonly priorities = [
  { id: 5, label: 'Haute',   variant: 'danger' },
  { id: 3, label: 'Moyenne', variant: 'warning' },
  { id: 1, label: 'Basse',   variant: 'neutral' },
];

// Génère tous les IDs de cellules pour cdkDropListConnectedTo
readonly allCellIds = this.priorities.flatMap(p =>
  this.columns.map(c => `cell-${p.id}-${c.id}`)
);

ticketsForCell(priorityId: number, statusId: number): Ticket[] {
  return this.tickets().filter(
    t => t.priority === priorityId && t.status === statusId
  );
}

onDropCell(event: CdkDragDrop<Ticket[]>, priorityId: number, statusId: number): void {
  if (event.previousContainer === event.container) return;
  const ticket = event.item.data as Ticket;
  // Peut changer statut ET/OU priorité selon la cellule cible
  this.tickets.update(list =>
    list.map(t => t.id === ticket.id
      ? { ...t, status: statusId, priority: priorityId }
      : t)
  );
  this.ticketService.update(ticket.id, { status: statusId, priority: priorityId }).catch(() => {});
}
```

```html
<div class="swimlanes">
  <!-- En-têtes colonnes (sticky) -->
  <div class="swimlanes__header-row">
    <div class="swimlanes__lane-label"></div>
    @for (col of columns; track col.id) {
      <div class="swimlanes__col-header">{{ col.label }}</div>
    }
  </div>

  @for (prio of priorities; track prio.id) {
    <div class="swimlanes__lane">
      <div class="swimlanes__lane-label">
        <app-badge [variant]="prio.variant">{{ prio.label }}</app-badge>
      </div>

      @for (col of columns; track col.id) {
        <div
          cdkDropList
          [id]="'cell-' + prio.id + '-' + col.id"
          [cdkDropListData]="ticketsForCell(prio.id, col.id)"
          [cdkDropListConnectedTo]="allCellIds"
          (cdkDropListDropped)="onDropCell($event, prio.id, col.id)"
          class="swimlanes__cell"
        >
          <span class="cell-count">{{ ticketsForCell(prio.id, col.id).length }}</span>
          @for (ticket of ticketsForCell(prio.id, col.id); track ticket.id) {
            <div cdkDrag [cdkDragData]="ticket" class="kanban-card">
              {{ ticket.titre }}
            </div>
          }
        </div>
      }
    </div>
  }
</div>
```

---

## 8. CSS Complet Kanban

```css
/* Board */
.kanban-board {
  display: flex;
  gap: var(--spacing-4);
  overflow-x: auto;
  height: calc(100vh - 220px);
  padding-bottom: var(--spacing-4);
}

/* Colonne */
.kanban-col {
  flex: 0 0 280px;
  display: flex;
  flex-direction: column;
  background: var(--color-surface);
  border-radius: var(--radius-8);
  border: 1px solid var(--color-border);
  overflow: hidden;
}

.kanban-col__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-3) var(--spacing-4);
  font-weight: var(--weight-semibold);
  border-bottom: 1px solid var(--color-border);
  transition: background var(--transition-base);
}

.kanban-col__body {
  flex: 1;
  overflow-y: auto;
  padding: var(--spacing-2);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2);
  min-height: 80px; /* IMPORTANT: zone droppable même si vide */
}

.kanban-col__empty {
  text-align: center;
  color: var(--color-text-muted);
  font-size: var(--text-12);
  padding: var(--spacing-4);
}

/* Carte */
.kanban-card {
  background: white;
  border-radius: var(--radius-8);
  padding: var(--spacing-3);
  box-shadow: var(--shadow-sm);
  cursor: grab;
  border-left: 3px solid transparent;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2);
}
.kanban-card:hover { box-shadow: var(--shadow-md); }
.kanban-card:active { cursor: grabbing; }

/* Drag & drop styles CDK */
.cdk-drag-preview {
  box-shadow: var(--shadow-lg);
  border-radius: var(--radius-8);
  opacity: 0.95;
}
.cdk-drag-placeholder { opacity: 0.3; background: var(--color-surface); }
.cdk-drop-list-dragging .kanban-card:not(.cdk-drag-placeholder) {
  transition: transform 250ms cubic-bezier(0, 0, 0.2, 1);
}

/* Sélecteur densité */
.density-bar {
  display: flex;
  gap: var(--spacing-2);
  margin-bottom: var(--spacing-3);
}
.density-bar button.active {
  background: var(--color-primary);
  color: var(--color-text-primary);
}

/* Filtre techniciens */
.tech-filter {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
  flex-wrap: wrap;
  margin-bottom: var(--spacing-3);
}
.tech-avatar-btn {
  cursor: pointer;
  border-radius: 50%;
  border: 2px solid transparent;
  transition: border-color var(--transition-fast);
}
.tech-avatar-btn.selected {
  border-color: var(--color-primary);
}

/* Swimlanes */
.swimlanes { display: flex; flex-direction: column; gap: var(--spacing-2); }
.swimlanes__header-row { display: grid; grid-template-columns: 120px repeat(3, 1fr); gap: var(--spacing-2); }
.swimlanes__lane { display: grid; grid-template-columns: 120px repeat(3, 1fr); gap: var(--spacing-2); }
.swimlanes__lane-label { display: flex; align-items: center; justify-content: center; }
.swimlanes__cell {
  background: var(--color-surface);
  border-radius: var(--radius-4);
  padding: var(--spacing-2);
  min-height: 60px;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2);
}
.cell-count { font-size: var(--text-11); color: var(--color-text-muted); text-align: right; }
```

---

## 9. Pièges

| Symptôme | Cause | Solution |
|----------|-------|----------|
| Carte ne se déplace pas entre colonnes | `cdkDropListConnectedTo` absent ou liste d'IDs incorrecte | Générer `connectedLists = columns.map(c => 'col-'+c.id)` et l'affecter sur chaque liste |
| `previousContainer === container` toujours vrai | IDs des drop-lists en double | Vérifier que chaque `[id]` est unique |
| Zone vide ne reçoit pas les drops | Hauteur nulle → CDK ne détecte pas la zone | Ajouter `min-height: 80px` au `cdkDropList` |
| Carte revient après drop | Signal non mis à jour | Appeler `tickets.update(...)` dans `moveTicket` |
| Mutation directe tableau | `list.push()` ne déclenche pas OnPush | Toujours `signal.update(list => [...list, new])` |
| Transition WIP bloque aussi le drop initial | Logique WIP appliquée même à la colonne source | Ignorer la vérification si `event.previousContainer === event.container` |
| Swim lanes — drop ignoré | `allCellIds` ne contient pas tous les IDs | Recalculer en croisant toutes priorités × toutes colonnes |
