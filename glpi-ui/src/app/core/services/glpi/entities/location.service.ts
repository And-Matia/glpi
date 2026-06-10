import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../../environment';
import { GlpiLocation } from '@app/core/models';

@Injectable({ providedIn: 'root' })
export class LocationService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.glpi.v2ApiUrl}/Administration/Location`;
  getAll(): Promise<GlpiLocation[]>              { return firstValueFrom(this.http.get<GlpiLocation[]>(this.base)); }
  getById(id: number): Promise<GlpiLocation>     { return firstValueFrom(this.http.get<GlpiLocation>(`${this.base}/${id}`)); }
  create(data: Partial<GlpiLocation>): Promise<{ id: number }> { return firstValueFrom(this.http.post<{ id: number }>(this.base, data)); }
  update(id: number, data: Partial<GlpiLocation>): Promise<void> { return firstValueFrom(this.http.put<void>(`${this.base}/${id}`, data)); }
  delete(id: number): Promise<void>           { return firstValueFrom(this.http.delete<void>(`${this.base}/${id}`)); }
}
