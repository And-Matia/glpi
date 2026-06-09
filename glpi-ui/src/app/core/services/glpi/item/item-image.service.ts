import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, switchMap } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../../../environment';

interface DocumentItemRaw { documents_id: number; }

@Injectable({ providedIn: 'root' })
export class ItemImageService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.glpi.v1ApiUrl;

  getImageUrl(itemId: number, apiType: string): Observable<string | null> {
    return this.http
      .get<DocumentItemRaw[]>(`${this.base}/${apiType}/${itemId}/Document_Item/`)
      .pipe(
        catchError(() => of([] as DocumentItemRaw[])),
        switchMap(docs => {
          if (!docs?.length) return of(null);
          const docId = docs[0].documents_id;
          return this.http
            .get(`${this.base}/Document/${docId}/download`, { responseType: 'blob' })
            .pipe(
              map(blob => URL.createObjectURL(blob)),
              catchError(() => of(null)),
            );
        }),
      );
  }
}
