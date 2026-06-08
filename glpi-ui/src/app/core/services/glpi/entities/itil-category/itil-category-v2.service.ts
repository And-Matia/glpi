import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../../environment';
import { GlpiITILCategory } from '@app/core/models/glpi/entities/itil-category.model';

@Injectable({ providedIn: 'root' })
export class ITILCategoryV2Service {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.glpi.v2ApiUrl}/Administration/ITILCategory`;

  getAll(): Observable<GlpiITILCategory[]> {
    return this.http.get<GlpiITILCategory[]>(this.base);
  }

  getById(id: number): Observable<GlpiITILCategory> {
    return this.http.get<GlpiITILCategory>(`${this.base}/${id}`);
  }

  create(data: Partial<GlpiITILCategory>): Observable<{ id: number }> {
    return this.http.post<{ id: number }>(this.base, data);
  }

  update(id: number, data: Partial<GlpiITILCategory>): Observable<void> {
    return this.http.put<void>(`${this.base}/${id}`, data);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
