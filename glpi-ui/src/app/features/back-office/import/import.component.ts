import { Component, ChangeDetectionStrategy, inject, signal, computed } from '@angular/core';
import { defer, from, Observable, throwError } from 'rxjs';
import { catchError, concatMap, tap, toArray } from 'rxjs/operators';
import { ImportStats } from '@app/core/models';
import { GlpiDropdownService } from '@app/core/services/glpi/dropdown.service';
import { ItemImportService } from '@app/core/services/import/item-import.service';
import { TicketImportService } from '@app/core/services/import/ticket-import.service';
import { TicketCostImportService } from '@app/core/services/import/ticket-cost-import.service';
import { ImageImportService } from '@app/core/services/import/image-import.service';
import { PageHeaderComponent } from '@app/shared/ui/page-header/page-header.component';
import { CardComponent } from '@app/shared/ui/card/card.component';
import { ButtonComponent } from '@app/shared/ui/button/button.component';
import { BadgeComponent } from '@app/shared/ui/badge/badge.component';
import { SpinnerComponent } from '@app/shared/ui/spinner/spinner.component';

type StepStatus = 'idle' | 'validating' | 'validated' | 'importing' | 'done' | 'error';

interface ImportStep {
  status:           StepStatus;
  selectedFile:     File | null;
  isDragOver:       boolean;
  result:           ImportStats | null;
  errorMsg:         string | null;
  validationErrors: string[];
}

const STEP_LABELS = [
  'Assets',
  'Tickets',
  'Coûts tickets',
  'Images',
] as const;

const STEP_ICONS = [
  'fa-solid fa-desktop',
  'fa-solid fa-ticket',
  'fa-solid fa-coins',
  'fa-solid fa-images',
] as const;

const ACCEPT = ['.csv', '.csv', '.csv', '.zip'] as const;

function emptyStep(): ImportStep {
  return { status: 'idle', selectedFile: null, isDragOver: false, result: null, errorMsg: null, validationErrors: [] };
}

@Component({
  selector: 'app-import',
  imports: [PageHeaderComponent, CardComponent, ButtonComponent, BadgeComponent, SpinnerComponent],
  templateUrl: './import.component.html',
  styleUrl: './import.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ImportComponent {
  private readonly dropdown         = inject(GlpiDropdownService);
  private readonly itemImport       = inject(ItemImportService);
  private readonly ticketImport     = inject(TicketImportService);
  private readonly ticketCostImport = inject(TicketCostImportService);
  private readonly imageImport      = inject(ImageImportService);

  readonly steps = signal<ImportStep[]>([emptyStep(), emptyStep(), emptyStep(), emptyStep()]);

  readonly stepLabels = STEP_LABELS;
  readonly stepIcons  = STEP_ICONS;
  readonly accept     = ACCEPT;

  readonly isProcessing = computed(() =>
    this.steps().some(s => s.status === 'validating' || s.status === 'importing')
  );

  readonly canImport = computed(() => {
    const steps = this.steps();
    return steps.some(s => s.status === 'validated') && !this.isProcessing();
  });

  // ── Drag & drop ───────────────────────────────────────────────────────────

  onDragOver(event: DragEvent, index: number): void {
    event.preventDefault();
    this.patchStep(index, { isDragOver: true });
  }

  onDragLeave(index: number): void {
    this.patchStep(index, { isDragOver: false });
  }

  onDrop(event: DragEvent, index: number): void {
    event.preventDefault();
    this.patchStep(index, { isDragOver: false });
    const file = event.dataTransfer?.files[0];
    if (file) this.handleFile(file, index);
  }

  onFileChange(event: Event, index: number): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) this.handleFile(file, index);
  }

  // ── Validation ────────────────────────────────────────────────────────────

  private handleFile(file: File, index: number): void {
    this.patchStep(index, { selectedFile: file, status: 'validating', validationErrors: [], errorMsg: null });

    this.getService(index).validateFile(file).then(errors => {
      if (errors.length > 0) {
        this.patchStep(index, { status: 'error', validationErrors: errors });
      } else {
        this.patchStep(index, { status: 'validated' });
      }
    });
  }

  // ── Import ────────────────────────────────────────────────────────────────

  startImport(): void {
    // Cross-sheet references (costs→tickets, images/tickets→items) are resolved by
    // querying GLPI directly (ticket `externalid`, item `name`), so no client-side
    // registry is needed. Only the dropdown cache is reset between runs.
    this.dropdown.clearCache();

    const tasks = this.steps()
      .map((step, i) => ({ step, i }))
      .filter(({ step }) => step.status === 'validated' && step.selectedFile)
      .map(({ step, i }) => this.runStep(step.selectedFile!, i));

    from(tasks).pipe(
      concatMap(task$ => task$),
      toArray(),
    ).subscribe();
  }

  private runStep(file: File, index: number): Observable<ImportStats> {
    // `defer` so a step only flips to "importing" and starts its work when the
    // sequential concatMap actually reaches it — never eagerly while building
    // the task list, which would run every step in parallel (e.g. images
    // looking up items before the items step has created them).
    return defer(() => {
      this.patchStep(index, { status: 'importing' });
      return this.getService(index).importFile(file);
    }).pipe(
      tap(stats => {
        this.patchStep(index, {
          result: stats,
          status: stats.failed > 0 && stats.success === 0 ? 'error' : 'done',
          errorMsg: stats.failed > 0
            ? `${stats.failed} ligne(s) en erreur sur ${stats.total}.`
            : null,
        });
      }),
      catchError(err => {
        this.patchStep(index, {
          status: 'error',
          errorMsg: err instanceof Error ? err.message : "Erreur lors de l'import",
        });
        return throwError(() => err);
      })
    );
  }

  // ── Reset ─────────────────────────────────────────────────────────────────

  reset(index: number): void {
    this.steps.update(steps => {
      const next = [...steps];
      next[index] = emptyStep();
      return next;
    });
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  private getService(index: number): ItemImportService | TicketImportService | TicketCostImportService | ImageImportService {
    switch (index) {
      case 0: return this.itemImport;
      case 1: return this.ticketImport;
      case 2: return this.ticketCostImport;
      case 3: return this.imageImport;
      default: throw new Error(`Étape invalide: ${index}`);
    }
  }

  private patchStep(index: number, patch: Partial<ImportStep>): void {
    this.steps.update(steps => {
      const next = [...steps];
      next[index] = { ...next[index], ...patch };
      return next;
    });
  }
}
