import { TestBed } from '@angular/core/testing';
import { PhaseHistoryComponent } from './phase-history';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';
import { vi } from 'vitest';

describe('PhaseHistoryComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PhaseHistoryComponent, TranslateModule.forRoot()],
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(PhaseHistoryComponent);
    const component = fixture.componentInstance;
    expect(component).toBeTruthy();
  });

  it('should render history text when historyKey is provided', () => {
    const fixture = TestBed.createComponent(PhaseHistoryComponent);
    const translateService = TestBed.inject(TranslateService);
    
    vi.spyOn(translateService, 'get').mockReturnValue(of('Translated Story'));
    
    fixture.componentRef.setInput('historyKey', 'SOME_KEY');
    fixture.detectChanges();
    
    const element = fixture.nativeElement.querySelector('div');
    expect(element.textContent).toContain('Translated Story');
  });

  it('should not render anything when historyKey is undefined', () => {
    const fixture = TestBed.createComponent(PhaseHistoryComponent);
    fixture.detectChanges();
    
    const element = fixture.nativeElement.querySelector('div');
    expect(element).toBeNull();
  });
});
