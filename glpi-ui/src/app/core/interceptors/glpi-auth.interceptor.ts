import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { GlpiSessionService } from '../services/glpi/session.service';
import { environment } from '../../../environment';

export const glpiAuthInterceptor: HttpInterceptorFn = (req, next) => {
  const session = inject(GlpiSessionService);

  if (req.url === environment.glpi.tokenUrl) {
    return next(req);
  }
  const isFormData = req.body instanceof FormData;
  const wantsJson = req.body != null && !isFormData;

  if (req.url.startsWith(environment.glpi.v1ApiUrl)) {
    const token = session.getSessionToken();
    if (token) {
      const headers: Record<string, string> = { 'Session-Token': token };
      if (wantsJson) headers['Content-Type'] = 'application/json';
      req = req.clone({ setHeaders: headers });
    }
  }

  if (req.url.startsWith(environment.glpi.v2ApiUrl) || req.url.startsWith(environment.glpi.graphqlUrl)) {
    const token = session.getAccessToken();
    if (token) {
      const headers: Record<string, string> = { 'Authorization': `Bearer ${token}` };
      if (wantsJson) headers['Content-Type'] = 'application/json';
      req = req.clone({ setHeaders: headers });
    }
  }

  return next(req);
};
