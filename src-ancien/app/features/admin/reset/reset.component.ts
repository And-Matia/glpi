import { Component, inject, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { ResetService } from '@app/core/services/reset.service';
import {
  ResetResult, ResetResource, FailedItem, ProgressInfo, RESOURCE_LABELS,
} from '@app/core/models';
import { AlertComponent } from '@app/shared/components/alert/alert.component';
import { BadgeComponent } from '@app/shared/ui/badge/badge.component';
import { ButtonComponent } from '@app/shared/ui/button/button.component';
import { PageHeaderComponent } from '@app/shared/ui/page-header/page-header.component';
import { SearchInputComponent } from '@app/shared/ui/search-input/search-input.component';
import { TableComponent } from '@app/shared/ui/table/table.component';
import { ALL_ENDPOINTS, PHASE_LABELS } from '@app/core/constants';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-reset',
  imports: [
    AlertComponent, BadgeComponent, ButtonComponent,
    PageHeaderComponent, SearchInputComponent, TableComponent,
  ],
  templateUrl: './reset.component.html',
  styleUrl: './reset.component.css',
})
export class ResetComponent {
  private readonly resetService = inject(ResetService);

  readonly endpointOptions   = ALL_ENDPOINTS;
  readonly selectedEndpoints = signal<Set<ResetResource>>(new Set());
  readonly endpointSearch    = signal('');
  readonly isRunning         = signal(false);
  readonly hasRun            = signal(false);
  readonly progress          = signal<ProgressInfo | null>(null);
  readonly result            = signal<ResetResult | null>(null);
  readonly showFailures      = signal(false);

  readonly filteredOptions = computed(() => {
    const term = this.endpointSearch().toLowerCase().trim();
    if (!term) return this.endpointOptions;
    return this.endpointOptions.filter(o => o.label.toLowerCase().includes(term));
  });

  readonly allSelected  = computed(() => this.selectedEndpoints().size === ALL_ENDPOINTS.length);
  readonly someSelected = computed(() =>
    this.selectedEndpoints().size > 0 && this.selectedEndpoints().size < ALL_ENDPOINTS.length,
  );
  readonly canRun = computed(() => !this.isRunning() && this.selectedEndpoints().size > 0);
  readonly isDone = computed(() => !this.isRunning() && this.hasRun());

  readonly successCount = computed(() => this.result()?.success.length ?? 0);
  readonly failedItems  = computed((): FailedItem[] => this.result()?.failed ?? []);
  readonly failedCount  = computed(() => this.failedItems().length);
  readonly stats        = computed(() => this.result()?.stats ?? []);

  readonly failureRows = computed(() =>
    this.failedItems().map(f => ({
      resource: RESOURCE_LABELS[f.endpoint] ?? f.endpoint,
      id:       f.id,
      error:    f.error,
    })),
  );

  readonly statsRows = computed(() =>
    this.stats().map(s => ({
      resource: RESOURCE_LABELS[s.endpoint] ?? s.endpoint,
      before:   s.beforeCount,
      after:    s.afterCount,
    })),
  );

  readonly progressPercent = computed(() => {
    const p = this.progress();
    if (!p || p.endpointsTotal === 0) return 0;
    return Math.round((p.endpointsDone / p.endpointsTotal) * 100);
  });

  readonly currentLabel = computed(() => {
    const p = this.progress();
    if (!p?.endpoint) return '';
    return this.endpointOptions.find(o => o.endpoint === p.endpoint)?.label ?? p.endpoint;
  });

  readonly phaseLabel = computed(() => {
    const p = this.progress();
    return p ? PHASE_LABELS[p.phase] : '';
  });

  readonly resourceLabel = (r: ResetResource): string => RESOURCE_LABELS[r] ?? r;

  onToggle(endpoint: ResetResource): void {
    const set = new Set(this.selectedEndpoints());
    if (set.has(endpoint)) {
      set.delete(endpoint);
    } else {
      set.add(endpoint);
    }
    this.selectedEndpoints.set(set);
    this.clearState();
  }

  onSearchChange(term: string): void { this.endpointSearch.set(term); }

  toggleAll(event: Event): void {
    if ((event.target as HTMLInputElement).checked) {
      this.selectedEndpoints.set(new Set(ALL_ENDPOINTS.map(o => o.endpoint)));
    } else {
      this.selectedEndpoints.set(new Set());
    }
    this.clearState();
  }

  toggleFailures(): void { this.showFailures.update(v => !v); }

  async run(): Promise<void> {
    this.isRunning.set(true);
    this.hasRun.set(false);
    this.result.set(null);
    this.progress.set(null);
    this.showFailures.set(false);
    try {
      const response = await this.resetService.reset(
        Array.from(this.selectedEndpoints()),
        (info: ProgressInfo) => this.progress.set(info),
      );
      this.result.set(response);
    } catch (e) {
      console.error(e);
    } finally {
      this.isRunning.set(false);
      this.hasRun.set(true);
    }
  }

  private clearState(): void {
    this.result.set(null);
    this.hasRun.set(false);
    this.progress.set(null);
  }
}
