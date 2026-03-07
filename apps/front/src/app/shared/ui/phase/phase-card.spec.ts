import { TestBed } from '@angular/core/testing';
import { PhaseCardComponent } from './phase-card';
import { TranslateModule } from '@ngx-translate/core';
import { PhaseConfig } from '../../../core/models/phase.model';

describe('PhaseCardComponent', () => {
  const mockConfig: PhaseConfig = {
    id: 1,
    titleKey: 'TITLE',
    badgeLabel: 'BADGE',
    hints: [],
    resolutionSteps: []
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PhaseCardComponent, TranslateModule.forRoot()],
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(PhaseCardComponent);
    fixture.componentRef.setInput('config', mockConfig);
    fixture.componentRef.setInput('hintsUnlocked', 0);
    fixture.componentRef.setInput('resolutionStage', 0);
    fixture.detectChanges();
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should show resolution when all hints are unlocked', () => {
    const fixture = TestBed.createComponent(PhaseCardComponent);
    const configWithHints: PhaseConfig = { 
      ...mockConfig, 
      hints: [{ labelKey: 'H1' }],
      resolutionSteps: [{ labelKey: 'S1' }]
    };
    
    fixture.componentRef.setInput('config', configWithHints);
    fixture.componentRef.setInput('hintsUnlocked', 1);
    fixture.componentRef.setInput('resolutionStage', 0);
    fixture.detectChanges();
    
    expect(fixture.nativeElement.querySelector('app-phase-resolution')).toBeTruthy();
  });
});
