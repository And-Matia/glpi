import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { GlpiSessionService } from '../services/glpi-session.service';
import { environment } from '../../../environment';

export const glpiAuthInterceptor: HttpInterceptorFn = (req, next) => {
  const session = inject(GlpiSessionService);

  if (req.url === environment.glpi.tokenUrl) {
    return next(req);
  }

  if (req.url.startsWith(environment.glpi.v1ApiUrl)) {
    const token = session.getSessionToken();
    if (token) {
      req = req.clone({
        setHeaders: {
          'Session-Token': token,
          'Content-Type': 'application/json'
        }
      });
    }
  }

  if (req.url.startsWith(environment.glpi.v2ApiUrl) || req.url.startsWith(environment.glpi.graphqlUrl)) {
    const token = session.getAccessToken();
    if (token) {
      req = req.clone({
        setHeaders: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
    }
  }

  return next(req);
};
