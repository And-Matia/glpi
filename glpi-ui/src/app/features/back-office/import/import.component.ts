import { Component, ChangeDetectionStrategy, inject, signal, computed } from '@angular/core';
import { ImportStats } from '@app/core/models';
import { GlpiDropdownService } from '@app/core/services/glpi/dropdown.service';
import { AssetImportService } from '@app/core/services/import/asset-import.service';
import { TicketImportService } from '@app/core/services/import/ticket-import.service';
import { TicketCostImportService } from '@app/core/services/import/ticket-cost-import.service';
import { ImageImportService } from '@app/core/services/import/image-import.service';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { PageHeaderComponent } from '@app/shared/ui/page-header/page-header.component';
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

interface ImportService {
  validateFile(file: File): Promise<string[]>;
  importFile(file: File): Promise<ImportStats>;
}

interface StepConfig {
  label:   string;
  icon:    string;
  accept:  string;
  service: ImportService;
}

function emptyStep(): ImportStep {
  return { status: 'idle', selectedFile: null, isDragOver: false, result: null, errorMsg: null, validationErrors: [] };
}

@Component({
  selector: 'app-import',
  imports: [PageHeaderComponent, MatCardModule, MatButtonModule, BadgeComponent, SpinnerComponent],
  templateUrl: './import.component.html',
  styleUrl: './import.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ImportComponent {
  private readonly dropdown         = inject(GlpiDropdownService);

  readonly stepConfigs: StepConfig[] = [
    { label: 'Assets',        icon: 'fa-solid fa-desktop', accept: '.csv', service: inject(AssetImportService)
    },
    { label: 'Tickets',       icon: 'fa-solid fa-ticket',  accept: '.csv', service: inject(TicketImportService)
    },
    { label: 'Coûts tickets', icon: 'fa-solid fa-coins',   accept: '.csv', service:
        inject(TicketCostImportService) },
    { label: 'Images',        icon: 'fa-solid fa-images',  accept: '.zip', service: inject(ImageImportService)
    },
  ];

  readonly steps = signal<ImportStep[]>([emptyStep(), emptyStep(), emptyStep(), emptyStep()]);

  readonly isProcessing = computed(() =>
    this.steps().some(s => s.status === 'validating' || s.status === 'importing')
  );

  readonly canImport = computed(() => {
    const steps = this.steps();
    return steps.some(s => s.status === 'validated') && !this.isProcessing();
  });

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

  private handleFile(file: File, index: number): void {
    this.patchStep(index, { selectedFile: file, status: 'validating', validationErrors: [], errorMsg: null });

    this.stepConfigs[index].service.validateFile(file).then(errors => {
      if (errors.length > 0) {
        this.patchStep(index, { status: 'error', validationErrors: errors });
      } else {
        this.patchStep(index, { status: 'validated' });
      }
    });
  }

  async startImport(): Promise<void> {
    this.dropdown.clearCache();

    const validatedSteps = this.steps()
      .map((step, i) => ({ step, i }))
      .filter(({ step }) => step.status === 'validated' && step.selectedFile);

    for (const { step, i } of validatedSteps) {
      await this.runStep(step.selectedFile!, i);
    }
  }

  private async runStep(file: File, index: number): Promise<void> {
    this.patchStep(index, { status: 'importing' });
    try {
      const stats = await this.stepConfigs[index].service.importFile(file);
      this.patchStep(index, {
        result: stats,
        status: stats.failed > 0 && stats.success === 0 ? 'error' : 'done',
        errorMsg: stats.failed > 0 ? `${stats.failed} ligne(s) en erreur sur ${stats.total}.` : null,
      });
    } catch (err) {
      this.patchStep(index, {
        status: 'error',
        errorMsg: err instanceof Error ? err.message : "Erreur lors de l'import",
      });
    }
  }

  reset(index: number): void {
    this.steps.update(steps => {
      const next = [...steps];
      next[index] = emptyStep();
      return next;
    });
  }


  private patchStep(index: number, patch: Partial<ImportStep>): void {
    this.steps.update(steps => {
      const next = [...steps];
      next[index] = { ...next[index], ...patch };
      return next;
    });
  }
}
