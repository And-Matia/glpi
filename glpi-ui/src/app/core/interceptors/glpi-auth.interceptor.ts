import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { environment } from '../../../environment';
import {GlpiSessionService} from '@app/core/services/glpi/lookup/session.service';
import {GLPI_CONFIG} from '@app/core/config/glpi.config';

export const glpiAuthInterceptor: HttpInterceptorFn = (req, next) => {
  const session = inject(GlpiSessionService);

  if (req.url === environment.glpi.tokenUrl) {
    return next(req);
  }
  const isFormData = req.body instanceof FormData;
  const wantsJson = req.body != null && !isFormData;

  if (req.url.startsWith(GLPI_CONFIG.apiV1)) {
    const token = session.getSessionToken();
    if (token) {
      const headers: Record<string, string> = { 'Session-Token': token };
      if (wantsJson) headers['Content-Type'] = 'application/json';
      req = req.clone({ setHeaders: headers });
    }
  }

  if (req.url.startsWith(GLPI_CONFIG.apiV2) || req.url.startsWith(environment.glpi.graphqlUrl)) {
    const token = session.getAccessToken();
    if (token) {
      const headers: Record<string, string> = { 'Authorization': `Bearer ${token}` };
      if (wantsJson) headers['Content-Type'] = 'application/json';
      req = req.clone({ setHeaders: headers });
    }
  }

  return next(req);
};
