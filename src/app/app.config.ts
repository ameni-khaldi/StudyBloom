import { registerLocaleData } from '@angular/common';
import localeFr from '@angular/common/locales/fr';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { ApplicationConfig, LOCALE_ID, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { tokenInterceptor } from './interceptors/token';

registerLocaleData(localeFr);
export const appConfig: ApplicationConfig = { providers: [
  { provide: LOCALE_ID, useValue: 'fr' },
  provideZoneChangeDetection({ eventCoalescing: true }),
  provideRouter(routes),
  provideHttpClient(withInterceptors([tokenInterceptor]))
] };
