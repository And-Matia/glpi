import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { GlpiSessionService } from '../services/glpi-session.service';
import { environment } from '../../../environment';

export const glpiAuthInterceptor: HttpInterceptorFn = (req, next) => {
  const session = inject(GlpiSessionService);

  if (req.url === environment.glpi.tokenUrl) {
    return next(req);
  }

  // Only declare a JSON Content-Type when we actually send a JSON body.
  // - On a bodyless GET/DELETE, the GLPI v2 API tries to parse the (empty) body
  //   and answers 400 "Contenu du JSON invalide".
  // - On FormData uploads, the browser must set the multipart boundary itself.
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
