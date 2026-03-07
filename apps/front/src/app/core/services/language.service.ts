import { Injectable, inject, signal } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { SUPPORTED_LANGUAGES, DEFAULT_LANGUAGE_CODE } from '../constants/languages';

@Injectable({
  providedIn: 'root',
})
export class LanguageService {
  private translate = inject(TranslateService);

  /**
   * Reactive signal for current language code.
   */
  readonly currentLang = signal(this.translate.currentLang || DEFAULT_LANGUAGE_CODE);

  get languages() {
    return SUPPORTED_LANGUAGES;
  }

  setLanguage(code: string) {
    if (this.languages.some((l) => l.code === code)) {
      this.translate.use(code).subscribe(() => {
        this.currentLang.set(code);
      });
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
