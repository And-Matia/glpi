import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { PsConfigService } from '../config/ps-config.service';

@Injectable({ providedIn: 'root' })
export class PsXmlClient {
  private http = inject(HttpClient);
  private config = inject(PsConfigService);

  private buildUrl(resource: string, params?: Record<string, string | number>, apiOrigin?: string): string {
    const baseUrl = apiOrigin || this.config.apiUrl;
    const isAbsolute = /^https?:\/\//i.test(baseUrl);
    const url = new URL(
      `${baseUrl}/${resource}`.replace(/([^:]\/)\/+/g, '$1'),
      isAbsolute ? undefined : 'http://localhost',
    );
    url.searchParams.set('output_format', 'XML');
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, String(value));
      });
    }
    return isAbsolute ? url.toString() : url.pathname + url.search;
  }

  get(resource: string, id: string | number, apiOrigin?: string): Observable<string> {
    return this.http.get(this.buildUrl(`${resource}/${id}`, undefined, apiOrigin), { responseType: 'text' });
  }

  getList(resource: string, filters?: Record<string, string | number>, apiOrigin?: string): Observable<string> {
    return this.http.get(this.buildUrl(resource, filters, apiOrigin), { responseType: 'text' });
  }

  post(resource: string, xmlBody: string, apiOrigin?: string): Observable<string> {
    return this.http.post(this.buildUrl(resource, undefined, apiOrigin), xmlBody, {
      responseType: 'text',
      headers: { 'Content-Type': 'text/xml' },
    });
  }

  /**
   * Posts a multipart/form-data body (e.g. a file upload). The Content-Type
   * header is intentionally left unset so the browser adds the boundary.
   */
  postForm(resource: string, form: FormData, apiOrigin?: string): Observable<string> {
    return this.http.post(this.buildUrl(resource, undefined, apiOrigin), form, { responseType: 'text' });
  }

  put(resource: string, id: string | number, xmlBody: string, apiOrigin?: string): Observable<string> {
    return this.http.put(this.buildUrl(`${resource}/${id}`, undefined, apiOrigin), xmlBody, {
      responseType: 'text',
      headers: { 'Content-Type': 'text/xml' },
    });
  }

  delete(resource: string, id: string | number, apiOrigin?: string): Observable<void> {
    return this.http
      .delete(this.buildUrl(`${resource}/${id}`, undefined, apiOrigin), { responseType: 'text' })
      .pipe(map(() => void 0));
  }
}
