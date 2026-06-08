import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../../environment';
import { GlpiITILCategory } from '@app/core/models/glpi/entities/itil-category.model';

@Injectable({ providedIn: 'root' })
export class ITILCategoryV1Service {
  private readonly http   = inject(HttpClient);
  private readonly base   = `${environment.glpi.v1ApiUrl}/ITILCategory`;
  private readonly params = new HttpParams().set('expand_dropdowns', '1');

  getAll(): Observable<GlpiITILCategory[]> {
    return this.http.get<GlpiITILCategory[]>(this.base, { params: this.params });
  }

  getById(id: number): Observable<GlpiITILCategory> {
    return this.http.get<GlpiITILCategory>(`${this.base}/${id}`, { params: this.params });
  }

  create(data: Partial<GlpiITILCategory>): Observable<{ id: number }> {
    return this.http.post<{ id: number }>(this.base, { input: data });
  }

  update(id: number, data: Partial<GlpiITILCategory>): Observable<void> {
    return this.http.put<void>(`${this.base}/${id}`, { input: data });
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
