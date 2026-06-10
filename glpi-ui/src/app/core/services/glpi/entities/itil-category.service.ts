import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../../environment';
import { GlpiITILCategory } from '@app/core/models';

@Injectable({ providedIn: 'root' })
export class ItilCategoryService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.glpi.v2ApiUrl}/Administration/ITILCategory`;
  getAll(): Promise<GlpiITILCategory[]>              { return firstValueFrom(this.http.get<GlpiITILCategory[]>(this.base)); }
  getById(id: number): Promise<GlpiITILCategory>     { return firstValueFrom(this.http.get<GlpiITILCategory>(`${this.base}/${id}`)); }
  create(data: Partial<GlpiITILCategory>): Promise<{ id: number }> { return firstValueFrom(this.http.post<{ id: number }>(this.base, data)); }
  update(id: number, data: Partial<GlpiITILCategory>): Promise<void> { return firstValueFrom(this.http.put<void>(`${this.base}/${id}`, data)); }
  delete(id: number): Promise<void>           { return firstValueFrom(this.http.delete<void>(`${this.base}/${id}`)); }
}
