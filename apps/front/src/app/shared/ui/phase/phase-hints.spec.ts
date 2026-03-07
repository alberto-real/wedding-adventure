import { TestBed } from '@angular/core/testing';
import { PhaseHintsComponent } from './phase-hints';
import { TranslateModule } from '@ngx-translate/core';

describe('PhaseHintsComponent', () => {
  const mockHints = [
    { labelKey: 'HINT_1', url: 'http://test.com', urlLabel: 'Test' },
    { labelKey: 'HINT_2' }
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PhaseHintsComponent, TranslateModule.forRoot()],
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(PhaseHintsComponent);
    fixture.componentRef.setInput('hints', mockHints);
    fixture.componentRef.setInput('unlockedCount', 0);
    fixture.detectChanges();
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render unlocked hints', () => {
    const fixture = TestBed.createComponent(PhaseHintsComponent);
    fixture.componentRef.setInput('hints', mockHints);
    fixture.componentRef.setInput('unlockedCount', 1);
    fixture.detectChanges();
    
    const alerts = fixture.nativeElement.querySelectorAll('.alert-info');
    expect(alerts.length).toBe(1);
    expect(fixture.nativeElement.querySelector('a').href).toBe('http://test.com/');
  });

  it('should emit unlock event when button is clicked', () => {
    const fixture = TestBed.createComponent(PhaseHintsComponent);
    fixture.componentRef.setInput('hints', mockHints);
    fixture.componentRef.setInput('unlockedCount', 0);
    
    let emitted = false;
    fixture.componentInstance.unlock.subscribe(() => emitted = true);
    
    fixture.detectChanges();
    fixture.nativeElement.querySelector('button').click();
    expect(emitted).toBe(true);
  });

  it('should hide button when all hints are unlocked', () => {
    const fixture = TestBed.createComponent(PhaseHintsComponent);
    fixture.componentRef.setInput('hints', mockHints);
    fixture.componentRef.setInput('unlockedCount', 2);
    fixture.detectChanges();
    
    const button = fixture.nativeElement.querySelector('button');
    expect(button).toBeNull();
  });
});
