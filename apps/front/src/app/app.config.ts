import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  importProvidersFrom, isDevMode,
} from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { appRoutes } from './app.routes';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { provideTranslateService } from '@ngx-translate/core';
import { provideTranslateHttpLoader } from '@ngx-translate/http-loader';
import { SocketIoModule, SocketIoConfig } from 'ngx-socket-io';

import { DEFAULT_LANGUAGE_CODE, SUPPORTED_LANGUAGES } from './core/constants/languages';
import { provideServiceWorker } from '@angular/service-worker';

const getInitialLanguage = (): string => {
  const browserLang = window.navigator.language.split('-')[0];
  const isSupported = SUPPORTED_LANGUAGES.some((lang) => lang.code === browserLang);
  return isSupported ? browserLang : DEFAULT_LANGUAGE_CODE;
};

const getSocketUrl = (): string => {
  const { hostname, protocol } = window.location;
  if (hostname === 'localhost' || /^(\d{1,3}\.){3}\d{1,3}$/.test(hostname)) {
    // Local development (including LAN/WiFi): backend on port 3000
    return `${protocol}//${hostname}:3000`;
  }
  // Production: Railway backend
  return 'https://wedding-adventureback-production.up.railway.app';
};

const socketConfig: SocketIoConfig = {
  url: getSocketUrl(),
  options: {},
};

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(appRoutes, withComponentInputBinding()),
    provideHttpClient(withFetch()),
    provideTranslateService({
      loader: provideTranslateHttpLoader({
        prefix: './assets/i18n/',
        suffix: '.json',
      }),
      lang: getInitialLanguage(),
    }),
    importProvidersFrom(SocketIoModule.forRoot(socketConfig)), provideServiceWorker('ngsw-worker.js', {
            enabled: !isDevMode(),
            registrationStrategy: 'registerWhenStable:30000'
          }),
  ],
};
