import {
  Component,
  inject,
  signal,
  ChangeDetectionStrategy,
  DestroyRef,
  computed,
} from '@angular/core';
import { AlertComponent } from '@app/shared/components/alert/alert.component';
import { LoaderComponent } from '@app/shared/components/loader/loader.component';
import { ImportStats } from '@app/core/models';
import { ProductCategoryImportService } from '@app/core/services/import/product-category-import.service';
import { CombinationImportService } from '@app/core/services/import/combination-import.service';
import { OrderImportService } from '@app/core/services/import/order-import.service';
import { ProductImageImportService } from '@app/core/services/import/product-image-import.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Observable, from, throwError } from 'rxjs';
import { catchError, concatMap, tap, toArray } from 'rxjs/operators';

type ImportStatus = 'idle' | 'validating' | 'validated' | 'importing' | 'done' | 'error';

interface ImportStep {
  status: ImportStatus;
  selectedFile: File | null;
  isDragOver: boolean;
  result: ImportStats | null;
  errorMsg: string | null;
  validationErrors: string[];
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-import',
  standalone: true,
  imports: [AlertComponent, LoaderComponent],
  templateUrl: './import.component.html',
  styleUrl: './import.component.css',
})
export class ImportComponent {
  private readonly productCategoryImport = inject(ProductCategoryImportService);
  private readonly combinationImport     = inject(CombinationImportService);
  private readonly orderImport           = inject(OrderImportService);
  private readonly productImageImport    = inject(ProductImageImportService);
  private readonly destroyRef = inject(DestroyRef);
  protected skipImageImport = signal(false);

  readonly steps = signal<ImportStep[]>([
    { status: 'idle', selectedFile: null, isDragOver: false, result: null, errorMsg: null, validationErrors: [] },
    { status: 'idle', selectedFile: null, isDragOver: false, result: null, errorMsg: null, validationErrors: [] },
    { status: 'idle', selectedFile: null, isDragOver: false, result: null, errorMsg: null, validationErrors: [] },
    { status: 'idle', selectedFile: null, isDragOver: false, result: null, errorMsg: null, validationErrors: [] },
  ]);

  readonly stepLabels = [
    'Produits & catégories',
    'Variantes & combinaisons',
    'Commandes & clients',
    'Images produits',
  ] as const;

  readonly canImport = computed(() => {
    const steps = this.steps();
    const hasValidated = steps.some(s => s.status === 'validated');
    const isProcessing = steps.some(s => s.status === 'validating' || s.status === 'importing');
    return hasValidated && !isProcessing;
  });

  onDragOver(e: DragEvent, stepIndex: number): void {
    e.preventDefault();
    this.steps.update(steps => {
      steps[stepIndex - 1].isDragOver = true;
      return [...steps];
    });
  }

  onDragLeave(stepIndex: number): void {
    this.steps.update(steps => {
      steps[stepIndex - 1].isDragOver = false;
      return [...steps];
    });
  }

  onDrop(e: DragEvent, stepIndex: number): void {
    e.preventDefault();
    this.onDragLeave(stepIndex);
    const file = e.dataTransfer?.files[0];
    if (file) this.handleFile(file, stepIndex);
  }

  onFileChange(event: Event, stepIndex: number): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) this.handleFile(file, stepIndex);
  }

  private handleFile(file: File, stepIndex: number): void {
    this.steps.update(steps => {
      const step = steps[stepIndex - 1];
      step.selectedFile = file;
      step.status = 'validating';
      step.validationErrors = [];
      step.errorMsg = null;
      return [...steps];
    });

    const importService = this.getImportService(stepIndex);
    importService.validateFile(file).then(errors => {
      this.steps.update(steps => {
        const step = steps[stepIndex - 1];
        if (errors.length > 0) {
          step.status = 'error';
          step.validationErrors = errors;
        } else {
          step.status = 'validated';
        }
        return [...steps];
      });
    });
  }

  startImport(): void {
    const importObservables = this.steps()
      .map((step, index) => ({ step, index }))
      .filter(({ step , index }) => step.status === 'validated' && step.selectedFile && (!this.skipImageImport() || index !== 3))
      .map(({ step, index }) => this.importFile(step.selectedFile!, index + 1));

    from(importObservables).pipe(
      concatMap(import$ => import$),
      toArray(), // Collect all results
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: () => console.log('Importation terminée'),
      error: (err) => console.error('Le flux d\'importation s\'est arrêté suite à une erreur :', err)
    });
  }

   private importFile(file: File, stepIndex: number): Observable<ImportStats> {
     this.steps.update(steps => {
       steps[stepIndex - 1].status = 'importing';
      return [...steps];
    });

    const importService = this.getImportService(stepIndex);
    return importService.importFile(file).pipe(
      tap(stats => {
        this.steps.update(steps => {
          const step = steps[stepIndex - 1];
          step.result = stats;

          if (stats.success > 0) {
            step.status = 'done';
            if (stats.failed > 0) {
              step.errorMsg = `Importation partielle terminée avec ${stats.failed} erreur(s).`;
            }
          } else if (stats.failed > 0) {
            step.status = 'error';
            const firstError = stats.errors[0];
            step.errorMsg = `Importation échouée (${stats.failed} erreurs). Première erreur (Ligne ${firstError.row}): ${firstError.error}`;
          } else {
            step.status = 'done';
          }
          return [...steps];
        });
      }),
      catchError(err => {
        this.steps.update(steps => {
          const step = steps[stepIndex - 1];
          step.errorMsg = err instanceof Error ? err.message : "Erreur lors de l'import";
          step.status = 'error';
          return [...steps];
        });
        return throwError(() => err);
      })
    );
  }

  private getImportService(stepIndex: number) {
    switch (stepIndex) {
      case 1: return this.productCategoryImport;
      case 2: return this.combinationImport;
      case 3: return this.orderImport;
      case 4: return this.productImageImport;
      default: throw new Error(`Étape d'import invalide : ${stepIndex}`);
    }
  }

  reset(stepIndex: number): void {
    this.steps.update(steps => {
      // When resetting a step, also reset all subsequent steps
      for (let i = stepIndex - 1; i < steps.length; i++) {
        steps[i] = { status: 'idle', selectedFile: null, isDragOver: false, result: null, errorMsg: null, validationErrors: [] };
      }
      return [...steps];
    });
  }
}
