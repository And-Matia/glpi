import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../../environment';
import { GlpiManufacturer } from '@app/core/models/glpi/entities/manufacturer.model';

@Injectable({ providedIn: 'root' })
export class ManufacturerV2Service {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.glpi.v2ApiUrl}/Administration/Manufacturer`;

  getAll(): Observable<GlpiManufacturer[]> {
    return this.http.get<GlpiManufacturer[]>(this.base);
  }

  getById(id: number): Observable<GlpiManufacturer> {
    return this.http.get<GlpiManufacturer>(`${this.base}/${id}`);
  }

  create(data: Partial<GlpiManufacturer>): Observable<{ id: number }> {
    return this.http.post<{ id: number }>(this.base, data);
  }

  update(id: number, data: Partial<GlpiManufacturer>): Observable<void> {
    return this.http.put<void>(`${this.base}/${id}`, data);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
