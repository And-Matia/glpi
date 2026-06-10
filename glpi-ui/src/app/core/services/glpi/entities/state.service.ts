import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../../environment';
import { GlpiState } from '@app/core/models';

@Injectable({ providedIn: 'root' })
export class StateService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.glpi.v2ApiUrl}/Administration/State`;
  getAll(): Promise<GlpiState[]>              { return firstValueFrom(this.http.get<GlpiState[]>(this.base)); }
  getById(id: number): Promise<GlpiState>     { return firstValueFrom(this.http.get<GlpiState>(`${this.base}/${id}`)); }
  create(data: Partial<GlpiState>): Promise<{ id: number }> { return firstValueFrom(this.http.post<{ id: number }>(this.base, data)); }
  update(id: number, data: Partial<GlpiState>): Promise<void> { return firstValueFrom(this.http.put<void>(`${this.base}/${id}`, data)); }
  delete(id: number): Promise<void>           { return firstValueFrom(this.http.delete<void>(`${this.base}/${id}`)); }
}
