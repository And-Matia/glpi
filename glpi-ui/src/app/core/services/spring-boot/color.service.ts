import {inject, Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {environment} from '../../../../environment';
import {Observable} from 'rxjs';
import {Color} from '@app/core/models/spring-boot/color.model';

@Injectable({providedIn: 'root'})
export class ColorService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.coreApiUrl}/Color`;

  getValue(id: number): Observable<string> {
    return this.http.get<string>(`${this.base}/${id}/value`);
  }

  getAll():Observable<Color[]> {
    return this.http.get<Color[]>(this.base);
  }
}
