# 11 — Formulaires Avancés

> Champs conditionnels, validation temps réel, brouillon auto-sauvegardé, wizard multi-étapes, édition en masse, inline editing.

---

## 1. Champs Conditionnels (selon type)

Afficher/masquer des champs selon la valeur d'un autre champ.

```typescript
type TicketType = 'incident' | 'demande';
readonly ticketType = signal<TicketType | null>(null);

// Champs spécifiques
readonly brokenItemId  = signal<number | null>(null); // incident
readonly requestedDate = signal('');                   // demande
readonly urgency       = signal<number | null>(null);  // les deux
```

```html
<app-select
  label="Type *"
  [options]="[{value:'incident',label:'Incident'},{value:'demande',label:'Demande'}]"
  [(value)]="ticketType"
/>

<!-- Champs conditionnels -->
@if (ticketType() === 'incident') {
  <app-select
    label="Élément en panne *"
    [options]="itemOptions()"
    [(value)]="brokenItemId"
    [errorMessage]="brokenItemError()"
  />
}

@if (ticketType() === 'demande') {
  <app-input
    label="Date souhaitée"
    type="date"
    [(value)]="requestedDate"
  />
}

@if (ticketType() !== null) {
  <app-select label="Urgence" [options]="urgencyOptions" [(value)]="urgency" />
}
```

### Validation conditionnelle

```typescript
readonly submitted = signal(false);

readonly brokenItemError = computed(() => {
  if (!this.submitted()) return '';
  if (this.ticketType() === 'incident' && !this.brokenItemId())
    return 'Élément requis pour un incident';
  return '';
});

async onSubmit(): Promise<void> {
  this.submitted.set(true);
  // Vérifier toutes les erreurs
  if (this.brokenItemError()) return;
  if (!this.ticketType()) return;
  // … soumettre
}
```

---

## 2. Validation en Temps Réel par Champ

```typescript
readonly name        = signal('');
readonly email       = signal('');
readonly submitted   = signal(false);
readonly nameTouched = signal(false); // validation au blur, pas au keystroke

readonly nameError = computed(() => {
  if (!this.nameTouched() && !this.submitted()) return '';
  if (!this.name().trim()) return 'Le nom est requis';
  if (this.name().length < 3) return 'Minimum 3 caractères';
  return '';
});

readonly emailError = computed(() => {
  if (!this.submitted()) return '';
  const email = this.email().trim();
  if (!email) return "L'email est requis";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Email invalide';
  return '';
});

// Complétion globale (ex: indicateur 3/5)
readonly validSections = computed(() => {
  let count = 0;
  if (this.name().trim().length >= 3) count++;
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.email())) count++;
  // … etc
  return count;
});
readonly totalSections = 5;
```

```html
<app-input
  label="Nom *"
  [(value)]="name"
  [errorMessage]="nameError()"
  (blur)="nameTouched.set(true)"
/>
<app-input label="Email *" [(value)]="email" [errorMessage]="emailError()" />

<!-- Indicateur de complétion -->
<div class="completion-indicator">
  <div class="completion-bar">
    <div class="completion-bar__fill"
         [style.width.%]="(validSections() / totalSections) * 100"></div>
  </div>
  <span>{{ validSections() }}/{{ totalSections }} sections valides</span>
</div>
```

---

## 3. Brouillon Auto-Sauvegardé

```typescript
private readonly DRAFT_KEY = 'ticket-draft';
private autoSaveInterval: ReturnType<typeof setInterval> | null = null;

ngOnInit(): void {
  this.restoreDraft();
  // Auto-save toutes les 30 secondes
  this.autoSaveInterval = setInterval(() => this.saveDraft(), 30_000);
}

ngOnDestroy(): void {
  if (this.autoSaveInterval) clearInterval(this.autoSaveInterval);
}

private saveDraft(): void {
  const draft = {
    title: this.title(),
    description: this.description(),
    type: this.ticketType(),
    savedAt: new Date().toISOString(),
  };
  localStorage.setItem(this.DRAFT_KEY, JSON.stringify(draft));
}

private restoreDraft(): void {
  const raw = localStorage.getItem(this.DRAFT_KEY);
  if (!raw) return;
  try {
    const draft = JSON.parse(raw);
    // Proposer la restauration (pas appliquer automatiquement)
    this.draftAvailable.set(true);
    this.draftDate.set(new Date(draft.savedAt).toLocaleString());
    this.savedDraft.set(draft);
  } catch {
    localStorage.removeItem(this.DRAFT_KEY);
  }
}

restoreFromDraft(): void {
  const draft = this.savedDraft();
  if (!draft) return;
  this.title.set(draft.title ?? '');
  this.description.set(draft.description ?? '');
  this.ticketType.set(draft.type ?? null);
  this.draftAvailable.set(false);
}

discardDraft(): void {
  localStorage.removeItem(this.DRAFT_KEY);
  this.draftAvailable.set(false);
}

async onSubmit(): Promise<void> {
  // … soumettre
  localStorage.removeItem(this.DRAFT_KEY); // Nettoyer après soumission
}

// Signaux pour l'UI
readonly draftAvailable = signal(false);
readonly draftDate = signal('');
readonly savedDraft = signal<any>(null);
```

```html
<!-- Bandeau de restauration de brouillon -->
@if (draftAvailable()) {
  <app-alert variant="info" title="Brouillon disponible" [dismissible]="false">
    Un brouillon a été sauvegardé le {{ draftDate() }}.
    <div class="draft-actions">
      <button mat-stroked-button (click)="restoreFromDraft()">Restaurer</button>
      <button mat-button (click)="discardDraft()">Ignorer</button>
    </div>
  </app-alert>
}

<app-input label="Titre *" [(value)]="title" />
<app-textarea label="Description" [(value)]="description" />
```

---

## 4. Wizard Multi-Étapes

```typescript
type Step = 'files' | 'mapping' | 'preview' | 'confirm';

readonly steps: { id: Step; label: string }[] = [
  { id: 'files',   label: 'Fichiers' },
  { id: 'mapping', label: 'Mapping' },
  { id: 'preview', label: 'Aperçu' },
  { id: 'confirm', label: 'Confirmation' },
];

readonly currentStep = signal<Step>('files');

readonly currentStepIndex = computed(() =>
  this.steps.findIndex(s => s.id === this.currentStep())
);

canGoNext = computed(() => {
  switch (this.currentStep()) {
    case 'files':   return this.selectedFiles().length > 0;
    case 'mapping': return this.mappingValid();
    case 'preview': return true;
    default:        return false;
  }
});

next(): void {
  const idx = this.currentStepIndex();
  if (idx < this.steps.length - 1) {
    this.currentStep.set(this.steps[idx + 1].id);
  }
}

back(): void {
  const idx = this.currentStepIndex();
  if (idx > 0) this.currentStep.set(this.steps[idx - 1].id);
}

goToStep(step: Step): void {
  const targetIdx = this.steps.findIndex(s => s.id === step);
  if (targetIdx <= this.currentStepIndex()) { // Seulement retour en arrière
    this.currentStep.set(step);
  }
}
```

```html
<!-- Barre d'étapes -->
<div class="wizard-steps">
  @for (step of steps; track step.id; let i = $index) {
    <div class="wizard-step"
         [class.active]="currentStep() === step.id"
         [class.done]="currentStepIndex() > i"
         [class.clickable]="currentStepIndex() >= i"
         (click)="currentStepIndex() >= i && goToStep(step.id)">
      <div class="wizard-step__dot">
        @if (currentStepIndex() > i) {
          <i class="fa-solid fa-check"></i>
        } @else {
          {{ i + 1 }}
        }
      </div>
      <span class="wizard-step__label">{{ step.label }}</span>
    </div>
    @if (i < steps.length - 1) {
      <div class="wizard-step__connector" [class.done]="currentStepIndex() > i"></div>
    }
  }
</div>

<!-- Contenu par étape -->
@switch (currentStep()) {
  @case ('files') {
    <div class="wizard-content">
      <app-dropzone accept=".csv" [multiple]="true" (filesSelected)="onFilesSelected($event)" />
    </div>
  }
  @case ('mapping') {
    <div class="wizard-content">
      <!-- Mapping colonnes CSV → champs app -->
    </div>
  }
  @case ('preview') {
    <div class="wizard-content">
      <!-- Aperçu des données -->
    </div>
  }
  @case ('confirm') {
    <div class="wizard-content">
      <!-- Résumé avant import -->
    </div>
  }
}

<!-- Navigation -->
<div class="wizard-nav">
  <button mat-button (click)="back()" [disabled]="currentStepIndex() === 0">
    Précédent
  </button>
  @if (currentStep() === 'confirm') {
    <button mat-flat-button [disabled]="submitting()" (click)="submit()">
      {{ submitting() ? 'Import en cours…' : 'Lancer l\'import' }}
    </button>
  } @else {
    <button mat-flat-button (click)="next()" [disabled]="!canGoNext()">
      Suivant
    </button>
  }
</div>
```

```css
.wizard-steps {
  display: flex;
  align-items: center;
  margin-bottom: var(--spacing-6);
}
.wizard-step {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-1);
}
.wizard-step.clickable { cursor: pointer; }
.wizard-step__dot {
  width: 32px; height: 32px;
  border-radius: 50%;
  border: 2px solid var(--color-border);
  display: flex; align-items: center; justify-content: center;
  font-weight: var(--weight-semibold);
  background: white;
}
.wizard-step.active .wizard-step__dot { border-color: var(--color-primary); background: var(--color-primary); }
.wizard-step.done .wizard-step__dot   { border-color: var(--color-success); background: var(--color-success); color: white; }
.wizard-step__connector {
  flex: 1;
  height: 2px;
  background: var(--color-border);
  margin: 0 var(--spacing-2);
  margin-bottom: var(--spacing-5); /* aligner avec les dots */
}
.wizard-step__connector.done { background: var(--color-success); }
.wizard-nav {
  display: flex;
  justify-content: space-between;
  margin-top: var(--spacing-6);
}
```

---

## 5. Édition en Masse (Bulk Edit)

Modifier plusieurs éléments simultanément avec champs « Ne pas modifier ».

```typescript
// Valeur sentinelle = ne pas toucher ce champ
const NO_CHANGE = '__NO_CHANGE__';

readonly selectedIds = signal<number[]>([]);

// Champs du formulaire en masse (null/'' = ne pas modifier)
readonly bulkStatus   = signal<number | null>(null);
readonly bulkAssignee = signal<number | null>(null);
readonly bulkType     = signal<string | null>(null);

// Champs cochés = seront appliqués
readonly applyStatus   = signal(false);
readonly applyAssignee = signal(false);
readonly applyType     = signal(false);

readonly hasChanges = computed(() =>
  this.applyStatus() || this.applyAssignee() || this.applyType()
);

async applyBulkEdit(): Promise<void> {
  if (this.selectedIds().length === 0 || !this.hasChanges()) return;

  this.submitting.set(true);
  const results = { success: 0, failed: 0, errors: [] as string[] };

  for (const id of this.selectedIds()) {
    try {
      const patch: any = {};
      if (this.applyStatus()   && this.bulkStatus()   !== null) patch.status   = this.bulkStatus();
      if (this.applyAssignee() && this.bulkAssignee() !== null) patch.assignee = this.bulkAssignee();
      if (this.applyType()     && this.bulkType()     !== null) patch.type     = this.bulkType();

      await this.service.update(id, patch);
      results.success++;
    } catch (err: any) {
      results.failed++;
      results.errors.push(`ID ${id}: ${err.message}`);
    }
  }

  this.bulkResults.set(results);
  this.submitting.set(false);
  await this.reload();
}

readonly bulkResults = signal<{ success: number; failed: number; errors: string[] } | null>(null);
```

```html
<!-- Formulaire d'édition en masse -->
<div class="bulk-edit-form">
  <h4>Modifier {{ selectedIds().length }} élément(s)</h4>

  <!-- Chaque champ avec une case à cocher pour l'activer -->
  <div class="bulk-field">
    <mat-checkbox [(ngModel)]="applyStatusValue" (change)="applyStatus.set($event.checked)">
      Changer le statut
    </mat-checkbox>
    @if (applyStatus()) {
      <app-select label="Statut" [options]="statusOptions" [(value)]="bulkStatus" />
    }
  </div>

  <div class="bulk-field">
    <mat-checkbox (change)="applyAssignee.set($event.checked)">
      Changer l'assigné
    </mat-checkbox>
    @if (applyAssignee()) {
      <app-select label="Technicien" [options]="techOptions()" [(value)]="bulkAssignee" />
    }
  </div>

  <button mat-flat-button
          [disabled]="!hasChanges() || submitting()"
          (click)="applyBulkEdit()">
    Appliquer aux {{ selectedIds().length }} sélectionnés
  </button>
</div>

<!-- Rapport résultat -->
@if (bulkResults()) {
  <app-alert [variant]="bulkResults()!.failed > 0 ? 'warning' : 'success'"
             [title]="'Résultat : ' + bulkResults()!.success + ' succès, ' + bulkResults()!.failed + ' échec(s)'">
    @if (bulkResults()!.errors.length > 0) {
      <ul>@for (e of bulkResults()!.errors; track e) { <li>{{ e }}</li> }</ul>
    }
  </app-alert>
}
```

**Alternative avec MatCheckbox sans NgModel** (pur signal) :

```html
<mat-checkbox [checked]="applyStatus()" (change)="applyStatus.set($event.checked)">
  Changer le statut
</mat-checkbox>
```

```typescript
// Importer MatCheckboxModule
imports: [MatCheckboxModule, /* … */]
```

---

## 6. Inline Editing (Édition dans le Tableau)

```typescript
// Quel élément et quel champ est en cours d'édition
readonly editingCell = signal<{ id: number; field: string } | null>(null);
readonly editingValue = signal<string | number | null>(null);

startEdit(itemId: number, field: string, currentValue: string | number): void {
  this.editingCell.set({ id: itemId, field });
  this.editingValue.set(currentValue);
}

async saveEdit(item: MyItem): Promise<void> {
  const cell = this.editingCell();
  if (!cell) return;

  // Sauvegarde optimiste
  const oldValue = item[cell.field as keyof MyItem];
  this.items.update(list =>
    list.map(i => i.id === item.id
      ? { ...i, [cell.field]: this.editingValue() }
      : i)
  );
  this.editingCell.set(null);

  try {
    await this.service.update(item.id, { [cell.field]: this.editingValue() });
    this.toast.success('Modifié');
  } catch {
    // Rollback
    this.items.update(list =>
      list.map(i => i.id === item.id ? { ...i, [cell.field]: oldValue } : i)
    );
    this.toast.error('Erreur — modification annulée');
  }
}

cancelEdit(): void {
  this.editingCell.set(null);
}

isEditing(id: number, field: string): boolean {
  return this.editingCell()?.id === id && this.editingCell()?.field === field;
}
```

```html
<!-- Cellule avec édition inline -->
<ng-template appCell="status" let-row>
  @if (isEditing(row.id, 'status')) {
    <!-- Mode édition -->
    <div class="inline-edit">
      <select [(ngModel)]="editingValueStr"
              (change)="editingValue.set(+editingValueStr)"
              class="inline-select">
        @for (opt of statusOptions; track opt.value) {
          <option [value]="opt.value">{{ opt.label }}</option>
        }
      </select>
      <button mat-icon-button (click)="saveEdit(row)" aria-label="Sauvegarder">
        <i class="fa-solid fa-check"></i>
      </button>
      <button mat-icon-button (click)="cancelEdit()" aria-label="Annuler">
        <i class="fa-solid fa-xmark"></i>
      </button>
    </div>
  } @else {
    <!-- Mode lecture avec bouton d'édition au survol -->
    <div class="inline-view" (dblclick)="startEdit(row.id, 'status', row.status)">
      <app-badge [variant]="statusVariant(row.status)">{{ statusLabel(row.status) }}</app-badge>
      <button mat-icon-button class="inline-edit-btn"
              (click)="startEdit(row.id, 'status', row.status)"
              aria-label="Modifier le statut">
        <i class="fa-solid fa-pen fa-xs"></i>
      </button>
    </div>
  }
</ng-template>
```

```css
.inline-view {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
}
.inline-edit-btn {
  opacity: 0;
  transition: opacity var(--transition-fast);
  scale: 0.8;
}
.inline-view:hover .inline-edit-btn { opacity: 1; }

.inline-edit {
  display: flex;
  align-items: center;
  gap: var(--spacing-1);
}
.inline-select {
  border: 1px solid var(--color-primary);
  border-radius: var(--radius-4);
  padding: var(--spacing-1) var(--spacing-2);
  font-size: var(--text-13);
}
```

---

## 7. Formulaire Multi-Sections avec Indicateur

```typescript
readonly sections = [
  { id: 'info',       label: 'Informations',       icon: 'fa-info' },
  { id: 'items',      label: 'Éléments associés',  icon: 'fa-server' },
  { id: 'attachments',label: 'Pièces jointes',     icon: 'fa-paperclip' },
];

readonly currentSection = signal('info');

// Validation par section
readonly sectionValid = computed(() => ({
  info:        !!this.title().trim() && !!this.type(),
  items:       true, // optionnel
  attachments: true, // optionnel
}));

readonly validCount = computed(() =>
  Object.values(this.sectionValid()).filter(Boolean).length
);
```

```html
<!-- Navigation par sections (tabs ou stepper latéral) -->
<div class="form-sections">
  <nav class="section-nav">
    @for (s of sections; track s.id) {
      <button class="section-nav__item"
              [class.active]="currentSection() === s.id"
              [class.valid]="sectionValid()[s.id]"
              (click)="currentSection.set(s.id)">
        <i [class]="'fa-solid ' + s.icon"></i>
        {{ s.label }}
        @if (sectionValid()[s.id]) {
          <i class="fa-solid fa-check section-check"></i>
        }
      </button>
    }
    <div class="section-progress">{{ validCount() }}/{{ sections.length }} sections</div>
  </nav>

  <div class="section-content">
    @switch (currentSection()) {
      @case ('info') {
        <app-input label="Titre *" [(value)]="title" />
        <app-select label="Type *" [options]="typeOptions" [(value)]="type" />
      }
      @case ('items') {
        <!-- Association d'éléments -->
      }
      @case ('attachments') {
        <app-dropzone accept=".pdf,.jpg,.png" [multiple]="true" (filesSelected)="addFiles($event)" />
      }
    }
  </div>
</div>
```

---

## 8. Pièges

| Symptôme | Cause | Solution |
|----------|-------|----------|
| `type="number"` retourne string | HTML input retourne toujours string | Convertir : `Number(value())` ou `+value()` |
| Select vaut `null` mais validation passe | `null` est falsy mais `if (!null)` → true | Vérifier explicitement `=== null` |
| Brouillon non restauré après rechargement | `ngOnInit` charge les données puis écrase les signaux | Appeler `restoreDraft()` APRÈS le chargement initial |
| Inline edit perd le focus | `(dblclick)` sur parent, `(click)` annule immédiatement | Utiliser `setTimeout(() => input.focus(), 0)` |
| Checkbox sans NgModule | `mat-checkbox` requiert `MatCheckboxModule` | Ajouter `MatCheckboxModule` aux `imports: []` |
| Wizard ne revient pas à l'étape précédente | `back()` sans validation de l'index | Vérifier `idx > 0` avant d'appeler `steps[idx-1]` |
| Indicateur de complétion toujours 0 | `computed()` ne se déclenche pas | S'assurer que les signaux de champs sont bien des `signal()` lus dans le `computed()` |
| Auto-save déclenché après destroy | `clearInterval` oublié dans `ngOnDestroy` | Stocker la ref interval et nettoyer dans `ngOnDestroy` |
