import { HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';

export function getErrorMessage(err: Error | unknown, defaultMsg = 'Une erreur est survenue'): string {
  if (err instanceof Error) return err.message;
  if (typeof err === 'string') return err;
  return defaultMsg;
}

export function handleError(error: HttpErrorResponse): Observable<never> {
  console.error('An error occurred:', error);
  return throwError(() => new Error('Something bad happened; please try again later.'));
}
