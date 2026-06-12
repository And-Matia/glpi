import { inject, Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { SPRING_CONFIG } from '@app/core/config/spring.config';
import {
  KanbanConfiguration,
  KanbanLanguage,
  KanbanStatus,
  KanbanStatusName,
} from '@app/core/models';

// ── Raw Spring Boot DTOs ──────────────────────────────────────────────────────

interface SpringLanguage {
  id: number;
  name: string;
}

interface SpringStatusName {
  id?: number;
  name: string;
  language: SpringLanguage;
}

interface SpringStatus {
  id?: number;
  color: string;
  names: SpringStatusName[];
}

// ─────────────────────────────────────────────────────────────────────────────

const GLPI_CODES = [1, 2, 6] as const;
const STORAGE_KEY = 'kanban_lang_id';

@Injectable({ providedIn: 'root' })
export class TicketStatusService {
  private readonly http = inject(HttpClient);
  private readonly base = `${SPRING_CONFIG.apiUrl}/tickets/status`;

  private readonly _config = signal<KanbanConfiguration>({ statuses: [], languages: [] });
  private readonly _selectedLangId = signal<number>(
    Number(localStorage.getItem(STORAGE_KEY)) || 0,
  );

  readonly configuration = this._config.asReadonly();

  readonly availableLanguages = computed<KanbanLanguage[]>(() =>
    this._config().languages,
  );

  readonly selectedLangId = computed(() => {
    const id    = this._selectedLangId();
    const langs = this.availableLanguages();
    if (!langs.length) return 0;
    return langs.some(l => l.id === id) ? id : langs[0].id;
  });

  readonly columns = computed(() => {
    const { statuses } = this._config();
    const langId = this.selectedLangId();
    return statuses.map(s => ({
      statusCode: s.glpiCode,
      label: s.names.find(n => n.language.id === langId)?.name
          ?? s.names[0]?.name
          ?? '',
      color: s.color,
    }));
  });

  setLang(langId: number): void {
    this._selectedLangId.set(langId);
    localStorage.setItem(STORAGE_KEY, String(langId));
  }

  async load(): Promise<void> {
    const raws = await firstValueFrom(this.http.get<SpringStatus[]>(this.base));
    this._config.set(this.mapConfiguration(raws));
  }

  updateStatus(status: KanbanStatus): Promise<KanbanStatus> {
    return firstValueFrom(
      this.http.put<SpringStatus>(this.base, this.toSpring(status)),
    ).then(raw => this.mapStatus(raw, status.glpiCode));
  }

  createStatus(status: Omit<KanbanStatus, 'id'>): Promise<KanbanStatus> {
    return firstValueFrom(
      this.http.post<SpringStatus>(this.base, this.toSpring(status)),
    ).then(raw => this.mapStatus(raw, status.glpiCode));
  }

  // ── Private mapping ─────────────────────────────────────────────────────────

  private mapConfiguration(raws: SpringStatus[]): KanbanConfiguration {
    const statuses = raws.slice(0, GLPI_CODES.length).map((raw, i) =>
      this.mapStatus(raw, GLPI_CODES[i]),
    );
    const seen = new Map<number, KanbanLanguage>();
    for (const s of statuses) {
      for (const n of s.names) {
        if (!seen.has(n.language.id)) seen.set(n.language.id, n.language);
      }
    }
    return { statuses, languages: [...seen.values()] };
  }

  private mapStatus(raw: SpringStatus, glpiCode: number): KanbanStatus {
    return {
      id:       raw.id,
      glpiCode,
      color:    raw.color,
      names:    raw.names.map(n => this.mapName(n)),
    };
  }

  private mapName(raw: SpringStatusName): KanbanStatusName {
    return {
      id:       raw.id,
      name:     raw.name,
      language: { id: raw.language.id, name: raw.language.name },
    };
  }

  private toSpring(status: Omit<KanbanStatus, 'glpiCode'>): SpringStatus {
    return {
      id:    status.id,
      color: status.color,
      names: status.names.map(n => ({
        id:       n.id,
        name:     n.name,
        language: { id: n.language.id, name: n.language.name },
      })),
    };
  }
}
