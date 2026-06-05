import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { PsConfigService } from '../config/ps-config.service';
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const config = inject(PsConfigService);
  const apiKey = config.apiKey;
  if (!apiKey) {
    return next(req);
  }
  const authHeader = 'Basic ' + btoa(apiKey + ':');
  const authReq = req.clone({
    setHeaders: {
      Authorization: authHeader
    }
  });
  return next(authReq);
};
