import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

export interface Example {
  id: number;
  name: string;
}

/**
 * Raw HTTP calls only — no state, no business logic.
 * Rename this file to match your first resource (e.g. ticket.http.ts).
 */
@Injectable({ providedIn: 'root' })
export class ExampleHttp {
  private readonly http = inject(HttpClient);

  getAll() {
    return this.http.get<Example[]>('/api/examples');
  }

  getById(id: number) {
    return this.http.get<Example>(`/api/examples/${id}`);
  }

  create(payload: Omit<Example, 'id'>) {
    return this.http.post<Example>('/api/examples', payload);
  }

  update(id: number, payload: Partial<Example>) {
    return this.http.patch<Example>(`/api/examples/${id}`, payload);
  }

  delete(id: number) {
    return this.http.delete<void>(`/api/examples/${id}`);
  }
}
