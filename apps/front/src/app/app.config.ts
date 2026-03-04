import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { appRoutes } from './app.routes';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { provideTranslateService } from '@ngx-translate/core';
import { provideTranslateHttpLoader } from '@ngx-translate/http-loader';

import { DEFAULT_LANGUAGE_CODE, SUPPORTED_LANGUAGES } from './core/constants/languages';

const getInitialLanguage = (): string => {
  const browserLang = window.navigator.language.split('-')[0];
  const isSupported = SUPPORTED_LANGUAGES.some((lang) => lang.code === browserLang);
  return isSupported ? browserLang : DEFAULT_LANGUAGE_CODE;
};

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(appRoutes),
    provideHttpClient(withFetch()),
    provideTranslateService({
      loader: provideTranslateHttpLoader({
        prefix: './assets/i18n/',
        suffix: '.json',
      }),
      lang: getInitialLanguage(),
    }),
  ],
};
