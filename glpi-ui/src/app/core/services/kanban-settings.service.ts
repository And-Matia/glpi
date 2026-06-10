import { Injectable, signal, computed } from '@angular/core';

export interface KanbanColumn {
  statusCode: number;
  labelFr: string;
  labelMg: string;
  color: string;
}

const STORAGE_KEY = 'kanban_settings';

const DEFAULTS: KanbanColumn[] = [
  { statusCode: 1, labelFr: 'Nouveau',     labelMg: 'Vaovao',    color: '#dbeafe' },
  { statusCode: 2, labelFr: 'En cours',    labelMg: 'Efa manao', color: '#fef3c7' },
  { statusCode: 5, labelFr: 'Résolu',      labelMg: 'Vita',      color: '#dcfce7' },
];

@Injectable({ providedIn: 'root' })
export class KanbanSettingsService {
  private readonly _columns = signal<KanbanColumn[]>(this.load());

  readonly columns = computed(() => this._columns());

  private load(): KanbanColumn[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : DEFAULTS;
    } catch {
      return DEFAULTS;
    }
  }

  save(columns: KanbanColumn[]): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(columns));
    this._columns.set([...columns]);
  }

  reset(): void {
    this.save(DEFAULTS);
  }
}
