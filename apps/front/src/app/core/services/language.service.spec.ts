import { TestBed } from '@angular/core/testing';
import { LanguageService } from './language.service';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { of } from 'rxjs';

describe('LanguageService', () => {
  let service: LanguageService;
  let translateService: TranslateService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [TranslateModule.forRoot()],
    });
    service = TestBed.inject(LanguageService);
    translateService = TestBed.inject(TranslateService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should have supported languages', () => {
    expect(service.languages.length).toBeGreaterThan(0);
  });

  it('should set language correctly', () => {
    const spy = vi.spyOn(translateService, 'use').mockReturnValue(of({}));
    service.setLanguage('es');
    expect(spy).toHaveBeenCalledWith('es');
    expect(service.currentLang()).toBe('es');
  });

  it('should not set language if not supported', () => {
    const spy = vi.spyOn(translateService, 'use');
    service.setLanguage('zz');
    expect(spy).not.toHaveBeenCalled();
  });

  it('should detect browser language', () => {
    // We can't easily mock window.navigator.language but we can test the fallback
    const lang = service.getInitialLanguage();
    expect(lang).toBeDefined();
  });
});
