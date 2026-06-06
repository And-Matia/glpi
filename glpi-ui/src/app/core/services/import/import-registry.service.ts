import { Injectable } from '@angular/core';
import { ItemType } from '@app/core/models';

interface ItemEntry { id: number; item_type: ItemType; }

const STORAGE_KEY = 'glpi-import-registry';

/**
 * Maps CSV references to the GLPI ids created during import:
 *   - items   : item name      → { id, item_type }
 *   - tickets : CSV Ref_Ticket → GLPI ticket id
 *
 * Persisted to localStorage so a later, separate import (e.g. costs alone,
 * sheet 3) can still resolve tickets imported in a previous run. The registry
 * is cleared when GLPI data is reset (see ResetComponent), keeping it in sync
 * with the backend. Re-importing simply overwrites existing entries by key.
 */
@Injectable({ providedIn: 'root' })
export class ImportRegistryService {
  private items   = new Map<string, ItemEntry>();
  private tickets = new Map<number, number>();

  constructor() {
    this.load();
  }

  registerItem(name: string, id: number, item_type: ItemType): void {
    this.items.set(name, { id, item_type });
    this.save();
  }

  getItem(name: string): ItemEntry | undefined {
    return this.items.get(name);
  }

  registerTicket(csvRef: number, glpiId: number): void {
    this.tickets.set(csvRef, glpiId);
    this.save();
  }

  getTicketId(csvRef: number): number | undefined {
    return this.tickets.get(csvRef);
  }

  clearAll(): void {
    this.items.clear();
    this.tickets.clear();
    try { localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
  }

  private load(): void {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const data = JSON.parse(raw) as { items?: [string, ItemEntry][]; tickets?: [number, number][] };
      this.items   = new Map(data.items   ?? []);
      this.tickets = new Map(data.tickets ?? []);
    } catch {
      this.items.clear();
      this.tickets.clear();
    }
  }

  private save(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        items:   [...this.items.entries()],
        tickets: [...this.tickets.entries()],
      }));
    } catch { /* storage unavailable — keep working in-memory */ }
  }
}
