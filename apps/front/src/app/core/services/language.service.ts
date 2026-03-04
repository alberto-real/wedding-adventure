import { Injectable, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { SUPPORTED_LANGUAGES, DEFAULT_LANGUAGE_CODE } from '../constants/languages';

@Injectable({
  providedIn: 'root',
})
export class LanguageService {
  private translate = inject(TranslateService);

  get languages() {
    return SUPPORTED_LANGUAGES;
  }

  get currentLang() {
    return this.translate.currentLang;
  }

  setLanguage(code: string) {
    if (this.languages.some((l) => l.code === code)) {
      this.translate.use(code);
    }
  }

  /**
   * Detects the browser language and checks if it's supported.
   * Falls back to the default language if not supported.
   */
  getInitialLanguage(): string {
    const browserLang = window.navigator.language.split('-')[0];
    const isSupported = this.languages.some((lang) => lang.code === browserLang);
    return isSupported ? browserLang : DEFAULT_LANGUAGE_CODE;
  }
}
