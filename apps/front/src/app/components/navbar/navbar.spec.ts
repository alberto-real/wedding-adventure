import { TestBed } from '@angular/core/testing';
import { NavbarComponent } from './navbar';
import { TranslateModule } from '@ngx-translate/core';
import { LanguageService } from '../../core/services/language.service';
import { provideRouter } from '@angular/router';

describe('NavbarComponent', () => {
  let langServiceMock: { languages: { code: string; name: string }[]; setLanguage: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    langServiceMock = {
      languages: [{ code: 'ca', name: 'Català' }, { code: 'es', name: 'Castellano' }],
      setLanguage: vi.fn()
    };

    await TestBed.configureTestingModule({
      imports: [NavbarComponent, TranslateModule.forRoot()],
      providers: [
        { provide: LanguageService, useValue: langServiceMock },
        provideRouter([])
      ]
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(NavbarComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should list available languages', () => {
    const fixture = TestBed.createComponent(NavbarComponent);
    expect(fixture.componentInstance.languages.length).toBe(2);
  });

  it('should call setLanguage when a language is selected', () => {
    const fixture = TestBed.createComponent(NavbarComponent);
    fixture.componentInstance.selectLanguage('es');
    expect(langServiceMock.setLanguage).toHaveBeenCalledWith('es');
  });

  it('should blur active element on language selection', () => {
    const fixture = TestBed.createComponent(NavbarComponent);
    const blurSpy = vi.fn();
    Object.defineProperty(document, 'activeElement', {
      value: { blur: blurSpy },
      configurable: true,
    });

    fixture.componentInstance.selectLanguage('ca');
    expect(blurSpy).toHaveBeenCalled();
  });
});
