import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';
import { inject } from '@angular/core';
import { LoggerService } from '../services/logger.service';
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const logger = inject(LoggerService, { optional: true });

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      const errorMessage =
        error.error instanceof ErrorEvent
          ? `Erreur: ${error.error.message}`
          : `Code d'erreur: ${error.status}, Message: ${error.message}`;

      if (logger) {
        logger.error(errorMessage, error);
      } else {
        console.error(errorMessage, error);
      }

      // Re-throw the original HttpErrorResponse — do NOT wrap it in a plain
      // Error. PsBaseService.handleError relies on `instanceof HttpErrorResponse`
      // to distinguish HTTP failures from serializer parse errors, and
      // LoggerService.apiError needs `error.error` (the PS XML body) to extract
      // the real PrestaShop message.
      return throwError(() => error);
    })
  );
};
