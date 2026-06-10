import {ApplicationConfig, inject, provideAppInitializer, provideBrowserGlobalErrorListeners} from '@angular/core';
import { provideRouter} from '@angular/router';
import {provideHttpClient, withInterceptors} from '@angular/common/http';

import { routes } from './app.routes';
import { GlpiSessionService } from '@app/core/services/glpi/session.service';
import { glpiAuthInterceptor } from '@app/core/interceptors/glpi-auth.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(withInterceptors([glpiAuthInterceptor])),
    provideAppInitializer(() => inject(GlpiSessionService).initAll())
  ]
};
