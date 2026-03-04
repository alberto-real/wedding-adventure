export interface Language {
  code: string;
  name: string;
  labelTranslationKey: string;
}

export const SUPPORTED_LANGUAGES: Language[] = [
  { code: 'ca', name: 'Català', labelTranslationKey: 'LANGUAGES.CA' },
  { code: 'es', name: 'Español', labelTranslationKey: 'LANGUAGES.ES' },
  { code: 'en', name: 'English', labelTranslationKey: 'LANGUAGES.EN' },
];

export const DEFAULT_LANGUAGE_CODE = 'en';
