import { Observable } from 'rxjs';

/**
 * Contract that every PrestaShop API class must satisfy.
 * Implemented automatically by extending PsBaseApi.
 */
export interface PsApiAdapter {
  getAll(filters?: Record<string, string | number>): Observable<string>;
  getOne(id: string | number): Observable<string>;
  create(data: string): Observable<string>;
  update(id: string | number, data: string): Observable<string>;
  delete(id: string | number): Observable<void>;
}

/**
 * Contract that every serializer class must satisfy.
 * T = full entity, W = writable (create/update) shape, L = list item shape.
 */
export interface PsSerializer<T, W, L> {
  parseList(xml: string): L[];
  parseFullList(xml: string): T[];
  parseOne(xml: string): T;
  serializeForWrite(data: W): string;
  serializeForUpdate(id: number, data: W): string;
}
