# 14 — Dashboard & Widgets

> KPI cards, animation de comptage, sélecteur de période, graphiques, drag-to-reorder, sauvegarde de disposition.

---

## 1. KPI Cards avec Animation de Comptage

### app-stat-card (composant existant)

```
Selector : <app-stat-card>
Inputs   : label, value (string|number), icon (fa class), variant ('primary'|'success'|'warning'|'danger')
```

```html
<div class="kpi-grid">
  @if (loading()) {
    @for (_ of [1,2,3,4]; track _) {
      <app-skeleton height="120px" />
    }
  } @else {
    <app-stat-card label="Éléments total"     [value]="animatedStats().totalItems"  icon="fa-server"       variant="primary" />
    <app-stat-card label="Tickets ouverts"    [value]="animatedStats().openTickets" icon="fa-ticket"       variant="warning" />
    <app-stat-card label="Tickets en retard"  [value]="animatedStats().lateTickets" icon="fa-clock"        variant="danger" />
    <app-stat-card label="Taux de résolution" [value]="animatedStats().resolvedPct + '%'" icon="fa-circle-check" variant="success" />
  }
</div>
```

### Animation de comptage (count-up)

```typescript
interface DashboardStats {
  totalItems: number;
  openTickets: number;
  lateTickets: number;
  resolvedPct: number;
}

readonly stats         = signal<DashboardStats | null>(null);
readonly animatedStats = signal<DashboardStats>({ totalItems: 0, openTickets: 0, lateTickets: 0, resolvedPct: 0 });

async ngOnInit(): Promise<void> {
  const data = await this.statsService.get();
  this.stats.set(data);
  this.animateCounters(data);
}

private animateCounters(target: DashboardStats): void {
  const duration = 800; // ms
  const fps = 60;
  const frames = (duration / 1000) * fps;
  let frame = 0;

  const interval = setInterval(() => {
    frame++;
    const progress = frame / frames;
    const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic

    this.animatedStats.set({
      totalItems:  Math.round(target.totalItems  * eased),
      openTickets: Math.round(target.openTickets * eased),
      lateTickets: Math.round(target.lateTickets * eased),
      resolvedPct: Math.round(target.resolvedPct * eased),
    });

    if (frame >= frames) {
      clearInterval(interval);
      this.animatedStats.set(target); // valeur exacte finale
    }
  }, 1000 / fps);
}
```

---

## 2. Sélecteur de Période

```typescript
type Period = '7d' | '30d' | 'custom';

readonly period    = signal<Period>('30d');
readonly customFrom = signal('');
readonly customTo   = signal('');

readonly dateRange = computed((): { from: string; to: string } => {
  const now = new Date();
  const fmt = (d: Date) => d.toISOString().split('T')[0];

  switch (this.period()) {
    case '7d': {
      const from = new Date(now); from.setDate(now.getDate() - 7);
      return { from: fmt(from), to: fmt(now) };
    }
    case '30d': {
      const from = new Date(now); from.setDate(now.getDate() - 30);
      return { from: fmt(from), to: fmt(now) };
    }
    case 'custom':
      return { from: this.customFrom(), to: this.customTo() };
  }
});

async selectPeriod(p: Period): Promise<void> {
  this.period.set(p);
  if (p !== 'custom') await this.refresh();
}

async applyCustomPeriod(): Promise<void> {
  if (!this.customFrom() || !this.customTo()) return;
  await this.refresh();
}

async refresh(): Promise<void> {
  this.loading.set(true);
  try {
    const range = this.dateRange();
    const data = await this.statsService.get(range.from, range.to);
    this.stats.set(data);
    this.animateCounters(data);
  } finally {
    this.loading.set(false);
  }
}
```

```html
<div class="period-bar">
  @for (opt of [{v:'7d',l:'7 jours'},{v:'30d',l:'30 jours'},{v:'custom',l:'Personnalisé'}]; track opt.v) {
    <button mat-stroked-button
            [class.active]="period() === opt.v"
            (click)="selectPeriod(opt.v)">
      {{ opt.l }}
    </button>
  }
  @if (period() === 'custom') {
    <app-input type="date" label="Depuis" [(value)]="customFrom" />
    <app-input type="date" label="Jusqu'au" [(value)]="customTo" />
    <button mat-flat-button [disabled]="!customFrom() || !customTo()"
            (click)="applyCustomPeriod()">
      Appliquer
    </button>
  }
</div>
```

---

## 3. Graphique en Barres (Chart.js via canvas)

> Pas de dépendance dédiée par défaut — utiliser Chart.js si disponible, sinon barres CSS.

### Option A — Barres CSS (aucune dépendance)

```typescript
interface DayData { date: string; new: number; inProgress: number; resolved: number; }
readonly chartData = signal<DayData[]>([]);

readonly maxValue = computed(() =>
  Math.max(...this.chartData().map(d => d.new + d.inProgress + d.resolved), 1)
);
```

```html
<div class="bar-chart">
  <!-- Légende cliquable -->
  <div class="chart-legend">
    @for (s of [{key:'new',label:'Nouveau',color:'var(--color-info)'},{key:'inProgress',label:'En cours',color:'var(--color-warning)'},{key:'resolved',label:'Résolu',color:'var(--color-success)'}]; track s.key) {
      <button class="legend-item"
              [class.hidden]="hiddenSeries().has(s.key)"
              (click)="toggleSeries(s.key)">
        <span class="legend-dot" [style.background]="s.color"></span>
        {{ s.label }}
      </button>
    }
  </div>

  <!-- Barres empilées -->
  <div class="bars-container">
    @for (day of chartData(); track day.date) {
      <div class="bar-group" [matTooltip]="tooltip(day)">
        <div class="bar-stack">
          @if (!hiddenSeries().has('resolved')) {
            <div class="bar-segment segment-resolved"
                 [style.height.%]="(day.resolved / maxValue()) * 100"></div>
          }
          @if (!hiddenSeries().has('inProgress')) {
            <div class="bar-segment segment-in-progress"
                 [style.height.%]="(day.inProgress / maxValue()) * 100"></div>
          }
          @if (!hiddenSeries().has('new')) {
            <div class="bar-segment segment-new"
                 [style.height.%]="(day.new / maxValue()) * 100"></div>
          }
        </div>
        <span class="bar-label">{{ formatDate(day.date) }}</span>
      </div>
    }
  </div>
</div>
```

```typescript
readonly hiddenSeries = signal<Set<string>>(new Set());
toggleSeries(key: string): void {
  this.hiddenSeries.update(s => {
    const next = new Set(s);
    if (next.has(key)) next.delete(key); else next.add(key);
    return next;
  });
}
tooltip(day: DayData): string {
  return `${day.date} — Nouveau: ${day.new}, En cours: ${day.inProgress}, Résolu: ${day.resolved}`;
}
```

```css
.bar-chart { display: flex; flex-direction: column; gap: var(--spacing-3); }
.chart-legend { display: flex; gap: var(--spacing-3); flex-wrap: wrap; }
.legend-item {
  display: flex; align-items: center; gap: var(--spacing-1);
  background: none; border: none; cursor: pointer; padding: var(--spacing-1);
  border-radius: var(--radius-4);
}
.legend-item.hidden { opacity: 0.4; text-decoration: line-through; }
.legend-dot { width: 12px; height: 12px; border-radius: 50%; }

.bars-container {
  display: flex;
  align-items: flex-end;
  gap: var(--spacing-1);
  height: 200px;
  border-bottom: 1px solid var(--color-border);
  padding-bottom: var(--spacing-1);
}
.bar-group { display: flex; flex-direction: column; align-items: center; flex: 1; gap: 4px; }
.bar-stack  { display: flex; flex-direction: column-reverse; width: 100%; gap: 1px; }
.bar-segment { transition: height var(--transition-base); border-radius: 2px 2px 0 0; min-height: 0; }
.segment-new         { background: var(--color-info); }
.segment-in-progress { background: var(--color-warning); }
.segment-resolved    { background: var(--color-success); }
.bar-label { font-size: var(--text-11); color: var(--color-text-muted); }
```

---

## 4. Drag-to-Reorder Widgets (CDK)

```typescript
import { CdkDragDrop, moveItemInArray, DragDropModule } from '@angular/cdk/drag-drop';

interface Widget { id: string; label: string; span?: number; }

readonly widgets = signal<Widget[]>([
  { id: 'kpi',     label: 'KPI',        span: 2 },
  { id: 'chart',   label: 'Graphique',  span: 1 },
  { id: 'tickets', label: 'Tickets',    span: 1 },
  { id: 'items',   label: 'Éléments',   span: 1 },
]);

onWidgetDrop(event: CdkDragDrop<Widget[]>): void {
  this.widgets.update(list => {
    const updated = [...list];
    moveItemInArray(updated, event.previousIndex, event.currentIndex);
    return updated;
  });
  this.saveLayout();
}

private saveLayout(): void {
  const order = this.widgets().map(w => w.id);
  localStorage.setItem('dashboard-layout', JSON.stringify(order));
}

ngOnInit(): void {
  this.restoreLayout();
}

private restoreLayout(): void {
  const raw = localStorage.getItem('dashboard-layout');
  if (!raw) return;
  try {
    const order: string[] = JSON.parse(raw);
    this.widgets.update(list =>
      order
        .map(id => list.find(w => w.id === id))
        .filter((w): w is Widget => w !== undefined)
    );
  } catch {}
}
```

```html
<!-- imports: [DragDropModule] -->
<div cdkDropList
     cdkDropListOrientation="mixed"
     (cdkDropListDropped)="onWidgetDrop($event)"
     class="dashboard-grid">
  @for (widget of widgets(); track widget.id) {
    <div cdkDrag [class]="'widget widget--' + widget.id">
      <!-- Poignée de drag (optionnelle, pour ne pas interférer avec les clics) -->
      <div cdkDragHandle class="widget__handle">
        <i class="fa-solid fa-grip-vertical"></i>
      </div>

      <div class="widget__content">
        @switch (widget.id) {
          @case ('kpi')     { <!-- Composant KPI --> }
          @case ('chart')   { <!-- Composant Chart --> }
          @case ('tickets') { <!-- Liste tickets --> }
          @case ('items')   { <!-- Liste éléments --> }
        }
      </div>

      <!-- Placeholder pendant le drag -->
      <div *cdkDragPlaceholder class="widget-placeholder"></div>
    </div>
  }
</div>
```

```css
.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: var(--spacing-4);
}

.widget {
  background: white;
  border-radius: var(--radius-8);
  box-shadow: var(--shadow-sm);
  overflow: hidden;
}

.widget__handle {
  cursor: grab;
  padding: var(--spacing-2) var(--spacing-3);
  background: var(--color-surface);
  color: var(--color-text-muted);
  display: flex;
  justify-content: flex-end;
}
.widget__handle:active { cursor: grabbing; }

.widget-placeholder {
  background: var(--color-surface);
  border: 2px dashed var(--color-border);
  border-radius: var(--radius-8);
  min-height: 100px;
}

/* Style pendant le drag */
.cdk-drag-preview {
  box-shadow: var(--shadow-lg);
  border-radius: var(--radius-8);
  opacity: 0.9;
}
.cdk-drag-animating { transition: transform 250ms cubic-bezier(0, 0, 0.2, 1); }
```

---

## 5. Comparaison Période Précédente

```typescript
// Calculer la période précédente équivalente
private getPreviousPeriod(): { from: string; to: string } {
  const range = this.dateRange();
  const from  = new Date(range.from);
  const to    = new Date(range.to);
  const diffMs = to.getTime() - from.getTime();

  const prevTo   = new Date(from);
  const prevFrom = new Date(from.getTime() - diffMs);

  return {
    from: prevFrom.toISOString().split('T')[0],
    to:   prevTo.toISOString().split('T')[0],
  };
}

readonly prevStats = signal<DashboardStats | null>(null);

async refresh(): Promise<void> {
  const [current, prev] = await Promise.all([
    this.statsService.get(this.dateRange().from, this.dateRange().to),
    this.statsService.get(...Object.values(this.getPreviousPeriod()) as [string, string]),
  ]);
  this.stats.set(current);
  this.prevStats.set(prev);
}

// Calculer la variation en %
variation(current: number, prev: number): string {
  if (prev === 0) return current > 0 ? '+∞%' : '—';
  const pct = ((current - prev) / prev) * 100;
  return (pct >= 0 ? '+' : '') + pct.toFixed(1) + '%';
}

variationVariant(current: number, prev: number, lowerIsBetter = false): string {
  if (prev === 0) return 'neutral';
  const up = current >= prev;
  return (up !== lowerIsBetter) ? 'success' : 'danger';
}
```

```html
<div class="kpi-card">
  <span class="kpi-value">{{ stats()?.openTickets }}</span>
  @if (prevStats()) {
    <app-badge [variant]="variationVariant(stats()!.openTickets, prevStats()!.openTickets, true)"
               size="sm">
      {{ variation(stats()!.openTickets, prevStats()!.openTickets) }}
    </app-badge>
  }
</div>
```

---

## 6. Indicateur de Synchronisation

```typescript
readonly lastSync = signal<Date | null>(null);
readonly syncStatus = signal<'idle' | 'syncing' | 'error'>('idle');

readonly lastSyncLabel = computed(() => {
  const d = this.lastSync();
  if (!d) return 'Jamais synchronisé';
  const diff = (Date.now() - d.getTime()) / 60_000;
  if (diff < 1) return 'À l\'instant';
  if (diff < 60) return `Il y a ${Math.floor(diff)} min`;
  return `Il y a ${Math.floor(diff / 60)}h`;
});

readonly dataStale = computed(() => {
  const d = this.lastSync();
  if (!d) return true;
  return (Date.now() - d.getTime()) > 15 * 60_000; // > 15 min = périmé
});

async syncNow(): Promise<void> {
  this.syncStatus.set('syncing');
  try {
    await this.syncService.sync();
    this.lastSync.set(new Date());
    this.syncStatus.set('idle');
    this.toast.success('Synchronisé');
    await this.refresh();
  } catch {
    this.syncStatus.set('error');
    this.toast.error('Erreur de synchronisation');
  }
}
```

```html
<div class="sync-indicator" [class.stale]="dataStale()">
  @switch (syncStatus()) {
    @case ('syncing') { <app-spinner size="sm" /> }
    @case ('error')   { <i class="fa-solid fa-triangle-exclamation" style="color:var(--color-danger)"></i> }
    @default          { <i class="fa-solid fa-rotate" [class.stale-icon]="dataStale()"></i> }
  }
  <span>{{ lastSyncLabel() }}</span>
  <button mat-icon-button (click)="syncNow()" [disabled]="syncStatus() === 'syncing'"
          aria-label="Synchroniser maintenant" matTooltip="Synchroniser">
    <i class="fa-solid fa-refresh"></i>
  </button>
</div>
```

---

## 7. Pièges

| Symptôme | Cause | Solution |
|----------|-------|----------|
| Animation compte jusqu'à la bonne valeur puis repart | `setInterval` pas nettoyé | Stocker la ref dans une variable et `clearInterval` quand `frame >= frames` |
| Widgets perdent l'ordre après rechargement | `localStorage` non utilisé | Appeler `saveLayout()` dans `onWidgetDrop` |
| `moveItemInArray` ne trigger pas OnPush | Mutation du tableau en place | Créer une copie : `const updated = [...list]; moveItemInArray(updated, ...); return updated;` |
| Graphique barres dépasse le conteneur | Valeurs très grandes → hauteur % > 100 | Diviser par `maxValue()` calculé sur le max réel |
| `cdkDragHandle` bloque les clics dans le widget | Handle couvre tout le widget | Limiter le `cdkDragHandle` à un petit élément (icône grip) |
| Taux résolution = NaN | Division par 0 si aucun ticket | Protéger : `total > 0 ? (resolved / total * 100) : 0` |
