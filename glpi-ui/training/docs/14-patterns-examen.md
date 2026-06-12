# 14 — Patterns Examen : 12 Catégories × 36 Séries

> Pour chaque catégorie : pattern UI (composants + code) et pattern métier (logique + service).
> Consulter les fichiers `ui/` pour le détail complet.

---

## 🗂️ 1. Kanban

**Fichiers** : `ui/09-kanban.md`

### Feature UI type : Sélecteur de densité

```typescript
type Density = 'compact' | 'normal' | 'detailed';
readonly density = signal<Density>('normal');
ngOnInit() { this.density.set(localStorage.getItem('kanban-density') as Density || 'normal'); }
setDensity(d: Density) { this.density.set(d); localStorage.setItem('kanban-density', d); }
```

```html
@if (density() !== 'compact') { <app-badge>{{ ticket.status }}</app-badge> }
@if (density() === 'detailed') { <p>{{ ticket.description.slice(0,80) }}…</p> }
```

### Feature UI type : Filtre technicien (opacité)

```typescript
readonly selectedTechs = signal<number[]>([]);
toggleTech(id: number) { this.selectedTechs.update(l => l.includes(id) ? l.filter(i => i !== id) : [...l, id]); }
isVisible(t: Ticket) { return !this.selectedTechs().length || this.selectedTechs().includes(t.techId ?? -1); }
```

```html
<div cdkDrag [style.opacity]="isVisible(ticket) ? 1 : 0.3">
```

### Feature Métier type : WIP Limit

```typescript
readonly wipLimits = signal<Record<number, number>>({1:10, 2:5, 5:20});
onDrop(event, toId) {
  const limit = this.wipLimits()[toId];
  if (limit && this.ticketsForColumn(toId).length >= limit) {
    this.toast.error('Colonne pleine'); return;
  }
  this.moveTicket(event.item.data, toId);
}
```

### Feature Métier type : Transitions autorisées

```typescript
readonly ALLOWED: Record<number, number[]> = { 1:[2], 2:[5,1], 5:[] };
canTransition(from: number, to: number) { return this.ALLOWED[from]?.includes(to) ?? false; }
onDrop(event, toId) {
  const ticket = event.item.data as Ticket;
  if (!this.canTransition(ticket.status, toId)) { this.toast.warning('Non autorisé'); return; }
  if (toId === 5) { this.pendingTicket.set(ticket); this.solutionOpen.set(true); return; }
  this.moveTicket(ticket, toId);
}
```

---

## 📥 2. Import de Fichiers

**Fichiers** : `ui/06-overlays.md` (dropzone), `ui/11-formulaires-avances.md` (wizard)

### Feature UI type : Zone drag-drop avec aperçu

```html
<app-dropzone accept=".csv" [multiple]="false" (filesSelected)="onFile($event)" />
```

```typescript
async onFile(files: File[]): Promise<void> {
  const file = files[0];
  this.preview.set(await this.parseCsv(file));
}

private async parseCsv(file: File): Promise<string[][]> {
  const text = await file.text();
  return text.split('\n').slice(0, 6).map(line => line.split(';'));
}
```

```html
<!-- Aperçu 5 premières lignes -->
@if (preview().length) {
  <table class="preview-table">
    @for (row of preview(); track $index) {
      <tr>@for (cell of row; track $index) { <td>{{ cell }}</td> }</tr>
    }
  </table>
}
```

### Feature UI type : Wizard multi-étapes

```typescript
readonly steps = ['Fichiers', 'Mapping', 'Aperçu', 'Confirmation'];
readonly step  = signal(0);
next() { if (this.step() < this.steps.length - 1) this.step.update(s => s + 1); }
back() { if (this.step() > 0) this.step.update(s => s - 1); }
```

```html
@switch (step()) {
  @case (0) { <!-- Sélection fichiers --> }
  @case (1) { <!-- Mapping colonnes --> }
  @case (2) { <!-- Aperçu données --> }
  @case (3) { <!-- Confirmation + lancer --> }
}
```

### Feature Métier type : Validation pré-import

```typescript
interface ValidationResult { valid: boolean; errors: { row: number; msg: string }[]; warnings: { row: number; msg: string }[]; }

validate(rows: Record<string, string>[]): ValidationResult {
  const errors: any[] = [], warnings: any[] = [];
  const required = ['nom', 'type', 'statut'];

  for (const [i, row] of rows.entries()) {
    for (const col of required) {
      if (!row[col]?.trim()) errors.push({ row: i + 2, msg: `Colonne "${col}" vide` });
    }
    if (row['date'] && !/^\d{2}\/\d{2}\/\d{4}$/.test(row['date']))
      errors.push({ row: i + 2, msg: 'Date format invalide (DD/MM/YYYY)' });
    if (row['quantite'] && isNaN(+row['quantite']))
      warnings.push({ row: i + 2, msg: 'Quantité non numérique' });
  }
  return { valid: errors.length === 0, errors, warnings };
}
```

---

## 📊 3. Dashboard / Statistiques

**Fichiers** : `ui/14-dashboard-widgets.md`

### Feature UI type : KPI Cards + animation

```typescript
readonly animStats = signal({ total: 0, open: 0, late: 0, pct: 0 });
private animate(target: typeof this.animStats extends Signal<infer T> ? T : never): void {
  let f = 0; const N = 48;
  const iv = setInterval(() => {
    f++; const p = 1 - Math.pow(1 - f/N, 3);
    this.animStats.set({ total: Math.round(target.total*p), open: Math.round(target.open*p),
                         late: Math.round(target.late*p), pct: Math.round(target.pct*p) });
    if (f >= N) { clearInterval(iv); this.animStats.set(target); }
  }, 16);
}
```

```html
<div class="kpi-grid">
  <app-stat-card label="Total éléments"    [value]="animStats().total" icon="fa-server" />
  <app-stat-card label="Tickets ouverts"   [value]="animStats().open"  icon="fa-ticket"  variant="warning" />
  <app-stat-card label="En retard"         [value]="animStats().late"  icon="fa-clock"   variant="danger" />
  <app-stat-card label="Taux résolution"   [value]="animStats().pct + '%'" icon="fa-check" variant="success" />
</div>
```

### Feature UI type : Drag-to-reorder widgets

```typescript
readonly widgets = signal(['kpi','chart','tickets','items']);
onWidgetDrop(event: CdkDragDrop<string[]>) {
  this.widgets.update(list => { const l = [...list]; moveItemInArray(l, event.previousIndex, event.currentIndex); return l; });
  localStorage.setItem('dashboard-layout', JSON.stringify(this.widgets()));
}
```

### Feature Métier type : Comparaison période précédente

```typescript
variation(current: number, prev: number): string {
  if (!prev) return '—';
  return ((current - prev) / prev * 100).toFixed(1) + '%';
}
```

---

## 📋 4. Tableaux / Listes

**Fichiers** : `ui/05-table.md`, `ui/12-tableaux-avances.md`

### Feature UI type : Colonnes masquables + pagination

```typescript
readonly hiddenCols = signal<Set<string>>(new Set());
readonly visibleCols = computed(() => this.columns.filter(c => !this.hiddenCols().has(c.key)));
readonly pageSize = signal(25); readonly pageIdx = signal(0);
readonly paged = computed(() => this.filtered().slice(this.pageIdx() * this.pageSize(), (this.pageIdx()+1) * this.pageSize()));
onPage(e: PageEvent) { this.pageIdx.set(e.pageIndex); this.pageSize.set(e.pageSize); }
```

```html
<app-table [columns]="visibleCols()" [rows]="paged()" />
<mat-paginator [length]="filtered().length" [pageSize]="pageSize()" [pageSizeOptions]="[10,25,50]" (page)="onPage($event)" />
```

### Feature UI type : Lignes extensibles

```typescript
readonly expanded = signal<Set<number>>(new Set());
toggleExpand(id: number) { this.expanded.update(s => { const n = new Set(s); n.has(id)?n.delete(id):n.add(id); return n; }); }
```

```html
<tr (click)="toggleExpand(row.id)">…</tr>
@if (expanded().has(row.id)) { <tr class="detail"><td [colSpan]="cols.length">{{ row.description }}</td></tr> }
```

### Feature Métier type : Multi-sélection + actions groupées

```typescript
readonly sel = signal<Set<number>>(new Set());
toggleAll() { this.sel.set(this.allSelected() ? new Set() : new Set(this.paged().map(r => r.id))); }
async bulkDelete() {
  const ids = [...this.sel()]; let ok=0, ko=0;
  for (const id of ids) { try { await this.svc.delete(id); ok++; } catch { ko++; } }
  this.toast[ko > 0 ? 'warning' : 'success'](`${ok} supprimés, ${ko} échecs`);
  this.sel.set(new Set()); await this.reload();
}
```

### Feature Métier type : Inline editing + sauvegarde optimiste

```typescript
// Voir ui/11-formulaires-avances.md §6 pour le pattern complet
async saveEdit(row: any): Promise<void> {
  const old = row[this.editingField()!];
  this.rows.update(l => l.map(r => r.id === row.id ? {...r, [this.editingField()!]: this.editingVal()} : r));
  this.editingCell.set(null);
  try { await this.svc.update(row.id, {[this.editingField()!]: this.editingVal()}); }
  catch { this.rows.update(l => l.map(r => r.id === row.id ? {...r, [this.editingField()!]: old} : r)); this.toast.error('Rollback'); }
}
```

---

## 🔎 5. Recherche Multicritère

**Fichiers** : `ui/13-recherche-filtres.md`

### Feature UI type : Filtres avancés + chips

```typescript
readonly chips = computed(() => [
  this.q().trim() && {key:'q', label:`"${this.q()}"`},
  this.type() && {key:'type', label:`Type: ${this.type()}`},
].filter(Boolean) as {key:string,label:string}[]);

removeChip(key: string) { if(key==='q') this.q.set(''); if(key==='type') this.type.set(null); }
```

```html
<mat-chip-set>
  @for (c of chips(); track c.key) {
    <mat-chip (removed)="removeChip(c.key)">{{ c.label }}<button matChipRemove>×</button></mat-chip>
  }
</mat-chip-set>
```

### Feature UI type : Autocomplete catégorisé

```html
<input [matAutocomplete]="auto" [formControl]="ctrl" />
<mat-autocomplete #auto (optionSelected)="onSelect($event.option.value)">
  @for (g of grouped(); track g[0]) {
    <mat-optgroup [label]="g[0]">
      @for (s of g[1]; track s.id) { <mat-option [value]="s">{{ s.label }}</mat-option> }
    </mat-optgroup>
  }
</mat-autocomplete>
```

### Feature Métier type : Debounce + annulation

```typescript
private readonly s$ = new Subject<string>();
constructor(private dr: DestroyRef) {
  this.s$.pipe(debounceTime(300), distinctUntilChanged(),
    switchMap(q => q ? this.svc.search(q).pipe(catchError(() => of([]))) : of([])),
    takeUntilDestroyed(dr)
  ).subscribe(r => this.results.set(r));
}
onInput(q: string) { this.s$.next(q); }
```

### Feature Métier type : Favoris + URL

```typescript
// Sauvegarder
saveFav(name: string) { const favs = JSON.parse(localStorage.getItem('favs')||'[]'); favs.push({id:Date.now(),name,criteria:{q:this.q(),type:this.type()}}); localStorage.setItem('favs',JSON.stringify(favs)); }
// URL
shareUrl() { this.router.navigate([], {queryParams:{q:this.q(),type:this.type()}, replaceUrl:true}); navigator.clipboard.writeText(location.href); }
```

---

## 📝 6. Formulaires Complexes

**Fichiers** : `ui/02-formulaires.md`, `ui/11-formulaires-avances.md`

### Feature UI type : Champs conditionnels

```typescript
readonly ticketType = signal<'incident'|'demande'|null>(null);
readonly itemId     = signal<number|null>(null);
readonly wantedDate = signal('');
```

```html
<app-select label="Type *" [options]="typeOpts" [(value)]="ticketType" />
@if (ticketType() === 'incident') {
  <app-select label="Élément en panne *" [options]="itemOpts()" [(value)]="itemId" [errorMessage]="itemErr()" />
}
@if (ticketType() === 'demande') {
  <app-input label="Date souhaitée" type="date" [(value)]="wantedDate" />
}
```

### Feature UI type : Wizard

```typescript
readonly step = signal(0);
readonly steps = ['Infos','Éléments','Pièces jointes','Confirmation'];
```

```html
<div class="steps-bar">
  @for (s of steps; track $index) {
    <div [class.active]="step() === $index" [class.done]="step() > $index" (click)="$index <= step() && step.set($index)">{{ s }}</div>
  }
</div>
@switch (step()) {
  @case (0) { <!-- Infos --> }
  @case (1) { <!-- Éléments --> }
  @case (2) { <!-- Pièces jointes --> }
  @case (3) { <!-- Confirmation --> }
}
<div class="form-actions">
  @if (step() > 0) { <button mat-button (click)="step.update(s=>s-1)">Précédent</button> }
  @if (step() < steps.length-1) { <button mat-flat-button (click)="step.update(s=>s+1)">Suivant</button> }
  @else { <button mat-flat-button (click)="submit()">Soumettre</button> }
</div>
```

### Feature Métier type : Brouillon auto-sauvegardé

```typescript
ngOnInit() { this.restoreDraft(); this.autoSave = setInterval(() => this.saveDraft(), 30_000); }
ngOnDestroy() { clearInterval(this.autoSave); }
saveDraft() { localStorage.setItem('draft', JSON.stringify({title:this.title(),desc:this.desc(),t:Date.now()})); }
restoreDraft() { const d = localStorage.getItem('draft'); if(d) { const p = JSON.parse(d); this.draftAvailable.set(true); this.draft.set(p); } }
applyDraft() { const d = this.draft(); this.title.set(d.title??''); this.desc.set(d.desc??''); this.draftAvailable.set(false); }
```

### Feature Métier type : Édition en masse

```typescript
readonly applyStatus = signal(false); readonly bulkStatus = signal<number|null>(null);
async applyBulk() {
  for (const id of this.sel()) {
    try {
      await this.svc.update(id, { ...(this.applyStatus() && {status: this.bulkStatus()}) });
    } catch {}
  }
  await this.reload();
}
```

---

## 🪟 7. Dialogues / Modales

**Fichiers** : `ui/06-overlays.md`, `ui/10-modales-avancees.md`

### Feature UI type : Modale réutilisable + focus trap

```html
<!-- app-modal gère automatiquement : focus trap, scroll lock, fermeture Échap + backdrop -->
<app-modal [open]="open()" [title]="title" [size]="size" (closed)="open.set(false)">
  <ng-content />
  <div slot="footer"><ng-content select="[slot=footer]" /></div>
</app-modal>
```

### Feature UI type : Modales empilées

```typescript
readonly modal1 = signal(false); readonly modal2 = signal(false);
// modal2 s'ouvre depuis modal1, ferme modal2 → revient à modal1
closeModal2() { this.modal2.set(false); /* modal1 reste ouverte */ }
```

### Feature UI type : Drawer coulissant

```html
<mat-sidenav-container>
  <mat-sidenav-content><app-table (rowClick)="openDrawer($event)" /></mat-sidenav-content>
  <mat-sidenav position="end" [opened]="drawerOpen()" (closedStart)="drawerOpen.set(false)" style="width:420px">
    @if (selected()) { <fiche-detail [item]="selected()!" /> }
  </mat-sidenav>
</mat-sidenav-container>
```

### Feature Métier type : Changement statut conditionnel

```typescript
// Voir ui/10-modales-avancees.md §2 pour le pattern complet
changeStatus(ticket: Ticket, newStatus: number) {
  if (newStatus === STATUS_RESOLVED) { this.solutionOpen.set(true); this.pending.set(ticket); }
  else if (newStatus === STATUS_WAITING) { this.waitingOpen.set(true); this.pending.set(ticket); }
  else this.applyChange(ticket, newStatus);
}
```

---

## 🔐 8. Protection / Permissions

**Fichiers** : `ui/15-permissions-auth.md`

### Feature UI type : Page login code unique

```html
<div class="code-row">
  <app-input label="Code" [type]="visible()?'text':'password'" [(value)]="code" [errorMessage]="err()" />
  <button mat-icon-button (click)="visible.update(v=>!v)"><i [class]="visible()?'fa-eye-slash':'fa-eye'" class="fa-solid"></i></button>
</div>
<button mat-flat-button [disabled]="!code().trim() || locked()" (click)="login()">Accéder</button>
```

### Feature UI type : Bandeau mode protégé

```html
<div class="protected-banner role-{{ auth.role() }}">
  <i class="fa-solid fa-shield-halved"></i> Mode protégé — {{ roleLabel() }}
  <button mat-button (click)="logout()">Déconnecter</button>
</div>
```

### Feature Métier type : Niveaux d'accès multiples

```typescript
login(code: string): boolean {
  const map: Record<string,string> = { [env.adminCode]:'admin', [env.opCode]:'operator', [env.roCode]:'readonly' };
  const role = map[code];
  if (!role) return false;
  localStorage.setItem('role', role);
  this.user.set(role);
  return true;
}
canEdit() { return ['admin','operator'].includes(this.auth.role()??''); }
canDelete() { return this.auth.role() === 'admin'; }
```

### Feature Métier type : Élévation à la volée

```typescript
// Voir ui/15-permissions-auth.md §6 pour le pattern complet
requireElevation(action: ()=>Promise<void>) {
  if (this.auth.isElevated()) { action(); return; }
  this.pendingAction = action; this.elevOpen.set(true);
}
async confirmElev() {
  if (!this.auth.elevate(this.elevCode())) { this.elevErr.set('Code incorrect'); return; }
  this.elevOpen.set(false); await this.pendingAction?.(); this.pendingAction = null;
}
```

---

## ♻️ 9. Réinitialisation / Gestion de Données

### Feature UI type : Double confirmation avec mot clé

```typescript
readonly confirmWord = signal(''); readonly MAGIC = 'REINITIALISER';
readonly canReset = computed(() => this.confirmWord() === this.MAGIC);
```

```html
<app-input label="Tapez REINITIALISER pour confirmer" [(value)]="confirmWord" />
<button mat-flat-button color="warn" [disabled]="!canReset() || resetting()" (click)="reset()">
  {{ resetting() ? 'En cours…' : 'Réinitialiser' }}
</button>
```

### Feature Métier type : Réinitialisation sélective + asynchrone

```typescript
readonly resetOptions = signal({ items: true, tickets: true, settings: false });

async reset(): Promise<void> {
  this.resetting.set(true);
  const opts = this.resetOptions();
  // Ordre FK : tickets (dépend de items) avant items
  if (opts.tickets) await this.resetService.resetTickets();
  if (opts.items)   await this.resetService.resetItems();
  if (opts.settings) await this.resetService.resetSettings();
  this.confirmWord.set(''); this.resetting.set(false);
  this.toast.success('Réinitialisation terminée');
}

// Aperçu avant reset
async loadCounts(): Promise<void> {
  const [items, tickets] = await Promise.all([this.itemSvc.count(), this.ticketSvc.count()]);
  this.counts.set({ items, tickets });
}
```

---

## ⚙️ 10. Personnalisation / Paramètres

### Feature UI type : Color picker + aperçu en direct

```typescript
readonly colColors = signal({ 1: '#e3f2fd', 2: '#fff3e0', 5: '#e8f5e9' });
setColor(colId: number, color: string) {
  this.colColors.update(c => ({ ...c, [colId]: color }));
  this.applyColors(); // CSS variables
}
private applyColors() {
  const c = this.colColors();
  document.documentElement.style.setProperty('--kanban-col-1-bg', c[1]);
  document.documentElement.style.setProperty('--kanban-col-2-bg', c[2]);
  document.documentElement.style.setProperty('--kanban-col-5-bg', c[5]);
}
```

```html
<div class="color-pickers">
  @for (col of [{id:1,label:'Nouveau'},{id:2,label:'En cours'},{id:5,label:'Résolu'}]; track col.id) {
    <label>{{ col.label }}
      <input type="color" [value]="colColors()[col.id]" (input)="setColor(col.id, $event.target.value)" />
    </label>
  }
</div>
```

### Feature UI type : Bascule langue (fr/mg)

```typescript
readonly lang = signal<'fr'|'mg'>('fr');
statusLabel(code: number): string {
  const labels = { fr: {1:'Nouveau', 2:'En cours', 5:'Résolu'}, mg: {1:'Vaovao', 2:'Efa manao', 5:'Vita'} };
  return labels[this.lang()][code as keyof typeof labels['fr']] ?? String(code);
}
```

### Feature Métier type : Validation contraste

```typescript
// Ratio de contraste WCAG (simplifié)
contrastRatio(bg: string, text = '#000000'): number {
  const lum = (hex: string) => {
    const r = parseInt(hex.slice(1,3),16)/255, g = parseInt(hex.slice(3,5),16)/255, b = parseInt(hex.slice(5,7),16)/255;
    const toLinear = (c: number) => c <= 0.03928 ? c/12.92 : Math.pow((c+0.055)/1.055, 2.4);
    return 0.2126*toLinear(r) + 0.7152*toLinear(g) + 0.0722*toLinear(b);
  };
  const L1 = lum(bg), L2 = lum(text);
  return (Math.max(L1,L2)+0.05) / (Math.min(L1,L2)+0.05);
}
isContrastOk(bg: string): boolean { return this.contrastRatio(bg) >= 4.5; }
```

---

## 🔄 11. Synchronisation ExistingApp ↔ NewApp

### Feature UI type : Indicateur de sync

```typescript
readonly lastSync    = signal<Date|null>(null);
readonly syncStatus  = signal<'idle'|'syncing'|'error'>('idle');
readonly stale       = computed(() => !this.lastSync() || Date.now() - this.lastSync()!.getTime() > 15*60_000);
readonly lastSyncLbl = computed(() => {
  const d = this.lastSync(); if (!d) return 'Jamais';
  const m = Math.floor((Date.now()-d.getTime())/60_000);
  return m < 1 ? 'À l\'instant' : m < 60 ? `Il y a ${m} min` : `Il y a ${Math.floor(m/60)}h`;
});
```

```html
<div class="sync-bar" [class.stale]="stale()">
  @if (syncStatus() === 'syncing') { <app-spinner size="sm" /> }
  <span>{{ lastSyncLbl() }}</span>
  <button mat-icon-button (click)="syncNow()" [disabled]="syncStatus()==='syncing'">
    <i class="fa-solid fa-rotate"></i>
  </button>
</div>
```

### Feature Métier type : File d'attente hors-ligne

```typescript
interface QueuedOp { id: string; type: 'create'|'update'|'delete'; payload: any; status: 'pending'|'ok'|'error'; error?: string; }
readonly queue = signal<QueuedOp[]>(JSON.parse(localStorage.getItem('op-queue')||'[]'));

enqueue(op: Omit<QueuedOp,'id'|'status'>) {
  const item: QueuedOp = { ...op, id: Date.now().toString(), status: 'pending' };
  this.queue.update(q => [...q, item]);
  this.persistQueue();
}

async replayQueue(): Promise<void> {
  for (const op of this.queue().filter(o => o.status === 'pending')) {
    try {
      await this.executeOp(op);
      this.queue.update(q => q.map(o => o.id===op.id ? {...o,status:'ok'} : o));
    } catch(e: any) {
      this.queue.update(q => q.map(o => o.id===op.id ? {...o,status:'error',error:e.message} : o));
    }
    this.persistQueue();
  }
}

retryOp(id: string) { this.queue.update(q => q.map(o => o.id===id ? {...o,status:'pending',error:undefined} : o)); this.replayQueue(); }
private persistQueue() { localStorage.setItem('op-queue', JSON.stringify(this.queue())); }
```

---

## 🎫 12. Fiches Détail / Workflow Ticket

### Feature UI type : Fiche à onglets

```html
<mat-tab-group>
  <mat-tab label="Détails">
    <dl class="detail-list">
      <dt>Statut</dt><dd><app-badge [variant]="statusVariant(ticket().status)">{{ statusLabel(ticket().status) }}</app-badge></dd>
      <dt>Priorité</dt><dd>{{ priorityLabel(ticket().priority) }}</dd>
    </dl>
  </mat-tab>
  <mat-tab label="Éléments liés">
    <!-- Liste des éléments -->
  </mat-tab>
  <mat-tab label="Historique">
    <!-- Fil d'activité -->
  </mat-tab>
  <mat-tab label="Solution">
    @if (ticket().solution) { <p>{{ ticket().solution }}</p> }
    @else { <app-empty-state icon="fa-question" title="Pas de solution" /> }
  </mat-tab>
</mat-tab-group>
```

### Feature UI type : Actions contextuelles selon statut

```typescript
readonly actions = computed(() => {
  const s = this.ticket()?.status;
  const all = [
    { id: 'take',    label: 'Prendre en charge', icon: 'fa-hand', showIf: [1] },
    { id: 'wait',    label: 'Mettre en attente',  icon: 'fa-pause', showIf: [2] },
    { id: 'resolve', label: 'Résoudre',            icon: 'fa-check', showIf: [2] },
    { id: 'close',   label: 'Clôturer',            icon: 'fa-lock',  showIf: [5] },
  ];
  return all.filter(a => a.showIf.includes(s ?? -1));
});
```

```html
<div class="ticket-actions">
  @for (action of actions(); track action.id) {
    <button mat-stroked-button (click)="handleAction(action.id)">
      <i [class]="'fa-solid ' + action.icon"></i> {{ action.label }}
    </button>
  }
</div>
```

### Feature Métier type : Machine à états + effets de bord

```typescript
async handleAction(actionId: string): Promise<void> {
  const ticket = this.ticket()!;
  switch (actionId) {
    case 'take':
      // Assignation automatique au technicien courant + changement statut
      await this.ticketSvc.assign(ticket.id, this.currentUserId);
      await this.ticketSvc.updateStatus(ticket.id, STATUS_IN_PROGRESS);
      break;
    case 'wait':
      this.waitingOpen.set(true); // demander motif + date
      return;
    case 'resolve':
      this.solutionOpen.set(true); // demander solution
      return;
    case 'close':
      if (ticket.status !== STATUS_RESOLVED) { this.toast.error('Doit être résolu avant clôture'); return; }
      await this.ticketSvc.updateStatus(ticket.id, STATUS_CLOSED);
      // Verrouiller l'édition après clôture
      this.locked.set(true);
      break;
  }
  await this.reload();
}
```

---

## Checklist Rapide par Feature

**Toute Feature UI**
- [ ] Standalone + OnPush + `inject()`
- [ ] Signaux pour tout l'état local
- [ ] `@if/@for/@switch` + `track`
- [ ] Tokens CSS uniquement
- [ ] Loading / empty / error gérés

**Toute Feature Métier**
- [ ] Service dans `core/services/`
- [ ] Modèle dans `core/models/`
- [ ] `async/await` + `firstValueFrom()` dans le composant
- [ ] Toast success/error
- [ ] `try/finally { loading.set(false) }`
- [ ] Confirmation pour les destructions (`app-confirm-dialog`)
