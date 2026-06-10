import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../../environment';
import { GlpiManufacturer } from '@app/core/models';

@Injectable({ providedIn: 'root' })
export class ManufacturerService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.glpi.v2ApiUrl}/Administration/Manufacturer`;
  getAll(): Promise<GlpiManufacturer[]>              { return firstValueFrom(this.http.get<GlpiManufacturer[]>(this.base)); }
  getById(id: number): Promise<GlpiManufacturer>     { return firstValueFrom(this.http.get<GlpiManufacturer>(`${this.base}/${id}`)); }
  create(data: Partial<GlpiManufacturer>): Promise<{ id: number }> { return firstValueFrom(this.http.post<{ id: number }>(this.base, data)); }
  update(id: number, data: Partial<GlpiManufacturer>): Promise<void> { return firstValueFrom(this.http.put<void>(`${this.base}/${id}`, data)); }
  delete(id: number): Promise<void>           { return firstValueFrom(this.http.delete<void>(`${this.base}/${id}`)); }
}
