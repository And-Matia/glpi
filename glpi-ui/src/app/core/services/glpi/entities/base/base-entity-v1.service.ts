import { inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../../environment';

// Base class for simple GLPI entity services (Location, Manufacturer, State, ITILCategory…).
// Each subclass only needs to declare the endpoint name — all CRUD is inherited.
export abstract class BaseEntityV1Service<T> {
  protected readonly http   = inject(HttpClient);
  protected readonly params = new HttpParams().set('expand_dropdowns', '1');

  // The GLPI API v1 entity name, e.g. "Location" or "ITILCategory".
  protected abstract readonly endpoint: string;

  private get base(): string {
    return `${environment.glpi.v1ApiUrl}/${this.endpoint}`;
  }

  getAll(): Observable<T[]> {
    return this.http.get<T[]>(this.base, { params: this.params });
  }

  getById(id: number): Observable<T> {
    return this.http.get<T>(`${this.base}/${id}`, { params: this.params });
  }

  create(data: Partial<T>): Observable<{ id: number }> {
    return this.http.post<{ id: number }>(this.base, { input: data });
  }

  update(id: number, data: Partial<T>): Observable<void> {
    return this.http.put<void>(`${this.base}/${id}`, { input: data });
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
