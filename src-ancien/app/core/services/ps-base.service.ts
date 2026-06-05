import { inject } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Observable, map, catchError, throwError } from 'rxjs';
import { LoggerService } from './logger.service';
import { PsApiAdapter, PsSerializer } from './ps-contracts.interface';

export abstract class PsBaseService<T, W, L> {
  protected abstract api: PsApiAdapter;
  protected abstract serializer: PsSerializer<T, W, L>;

  private readonly logger = inject(LoggerService);

  getAll(filters?: Record<string, string | number>): Observable<L[]> {
    return this.api.getAll(filters).pipe(
      map((xml: string) => this.serializer.parseList(xml)),
      catchError(err => this.handleError(err)),
    );
  }

  getAllFull(filters?: Record<string, string | number>): Observable<T[]> {
    return this.api.getAll({ display: 'full', ...filters }).pipe(
      map((xml: string) => this.serializer.parseFullList(xml)),
      catchError(err => this.handleError(err)),
    );
  }

  getById(id: string | number): Observable<T> {
    return this.api.getOne(id).pipe(
      map((xml: string) => this.serializer.parseOne(xml)),
      catchError(err => this.handleError(err)),
    );
  }

  create(data: W): Observable<T> {
    return this.api.create(this.serializer.serializeForWrite(data)).pipe(
      map((xml: string) => this.serializer.parseOne(xml)),
      catchError(err => this.handleError(err)),
    );
  }

  update(id: string | number, data: W): Observable<T> {
    return this.api.update(id, this.serializer.serializeForUpdate(Number(id), data)).pipe(
      map((xml: string) => this.serializer.parseOne(xml)),
      catchError(err => this.handleError(err)),
    );
  }

  delete(id: string | number): Observable<void> {
    return this.api.delete(id).pipe(
      catchError(err => this.handleError(err)),
    );
  }

  private handleError(err: unknown): Observable<never> {
    if (err instanceof HttpErrorResponse) {
      const message = this.logger.apiError(err);
      return throwError(() => new Error(message));
    }
    // Serializer / parse errors (not an HTTP failure — PS returned 2xx but unexpected body)
    const message = err instanceof Error ? err.message : String(err);
    this.logger.parseError(message);
    return throwError(() => (err instanceof Error ? err : new Error(message)));
  }
}
