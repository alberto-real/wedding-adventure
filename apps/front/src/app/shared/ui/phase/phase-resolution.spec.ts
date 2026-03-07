import { TestBed } from '@angular/core/testing';
import { PhaseResolutionComponent } from './phase-resolution';
import { TranslateModule } from '@ngx-translate/core';

describe('PhaseResolutionComponent', () => {
  const mockSteps = [
    { labelKey: 'STEP_1', isMono: true },
    { labelKey: 'STEP_2', isBold: true }
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PhaseResolutionComponent, TranslateModule.forRoot()],
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(PhaseResolutionComponent);
    fixture.componentRef.setInput('steps', mockSteps);
    fixture.componentRef.setInput('stage', 0);
    fixture.detectChanges();
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render resolved steps', () => {
    const fixture = TestBed.createComponent(PhaseResolutionComponent);
    fixture.componentRef.setInput('steps', mockSteps);
    fixture.componentRef.setInput('stage', 1);
    fixture.detectChanges();
    
    const alerts = fixture.nativeElement.querySelectorAll('.alert-warning');
    expect(alerts.length).toBe(1);
    expect(alerts[0].classList).toContain('font-mono');
  });

  it('should emit advance event when button is clicked', () => {
    const fixture = TestBed.createComponent(PhaseResolutionComponent);
    fixture.componentRef.setInput('steps', mockSteps);
    fixture.componentRef.setInput('stage', 0);
    
    let emitted = false;
    fixture.componentInstance.advance.subscribe(() => emitted = true);
    
    fixture.detectChanges();
    fixture.nativeElement.querySelector('button').click();
    expect(emitted).toBe(true);
  });

  it('should disable button and show OK when all steps are resolved', () => {
    const fixture = TestBed.createComponent(PhaseResolutionComponent);
    fixture.componentRef.setInput('steps', mockSteps);
    fixture.componentRef.setInput('stage', 2);
    fixture.detectChanges();
    
    const button = fixture.nativeElement.querySelector('button');
    expect(button.disabled).toBe(true);
    expect(button.textContent).toContain('OK');
  });
});
