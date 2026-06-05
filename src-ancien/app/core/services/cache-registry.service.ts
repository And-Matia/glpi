import { Injectable } from '@angular/core';

/**
 * Central registry of the in-memory caches held by the PS resource services.
 *
 * Each cached service registers a "clear" callback at construction. The import
 * pipeline calls `clearAll()` at the start of every run so that re-importing
 * without reloading the page never resolves references against stale data
 * (e.g. linking a combination to a product id from a previous import).
 */
@Injectable({ providedIn: 'root' })
export class CacheRegistry {
  private readonly clearers = new Set<() => void>();

  /** Registers a callback that empties one service's cache. */
  register(clear: () => void): void {
    this.clearers.add(clear);
  }

  /** Empties every registered cache. */
  clearAll(): void {
    this.clearers.forEach((clear) => clear());
  }
}
