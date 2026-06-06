import { Injectable } from '@angular/core';
import { ItemType } from '@app/core/models';

@Injectable({ providedIn: 'root' })
export class ImportRegistryService {
  private items = new Map<string, { id: number; item_type: ItemType }>();
  private tickets = new Map<number, number>(); // csvRef → glpiId

  registerItem(name: string, id: number, item_type: ItemType): void {
    this.items.set(name, { id, item_type });
  }

  getItem(name: string): { id: number; item_type: ItemType } | undefined {
    return this.items.get(name);
  }

  registerTicket(csvRef: number, glpiId: number): void {
    this.tickets.set(csvRef, glpiId);
  }

  getTicketId(csvRef: number): number | undefined {
    return this.tickets.get(csvRef);
  }

  clearAll(): void {
    this.items.clear();
    this.tickets.clear();
  }
}
