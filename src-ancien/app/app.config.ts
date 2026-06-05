import { ApplicationConfig, APP_INITIALIZER, inject } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { routes } from './app.routes';
import { authInterceptor, errorInterceptor } from '@app/core/interceptors';
import { PsConfigService } from '@app/core/config';

export function initializeApp() {
  const configService = inject(PsConfigService);
  return () => configService.loadConfig();
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes, withComponentInputBinding()),
    provideHttpClient(withInterceptors([authInterceptor, errorInterceptor])),
    {
      provide: APP_INITIALIZER,
      useFactory: initializeApp,
      multi: true
    }
  ]
};
