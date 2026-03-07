import { TestBed } from '@angular/core/testing';
import { PhaseListComponent } from './phase-list';
import { TranslateModule } from '@ngx-translate/core';
import { PhaseConfig } from '../../../core/models/phase.model';

describe('PhaseListComponent', () => {
  const mockConfig: PhaseConfig[] = [
    { id: 1, titleKey: 'T1', badgeLabel: 'B1', hints: [], resolutionSteps: [] }
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PhaseListComponent, TranslateModule.forRoot()],
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(PhaseListComponent);
    fixture.componentRef.setInput('config', mockConfig);
    fixture.componentRef.setInput('hintsUnlockedMap', { 1: 0 });
    fixture.componentRef.setInput('resolutionStageMap', { 1: 0 });
    fixture.detectChanges();
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should return correct counts from maps', () => {
    const fixture = TestBed.createComponent(PhaseListComponent);
    fixture.componentRef.setInput('config', mockConfig);
    fixture.componentRef.setInput('hintsUnlockedMap', { 1: 5 });
    fixture.componentRef.setInput('resolutionStageMap', { 1: 3 });
    
    expect(fixture.componentInstance.getHintsCount(1)).toBe(5);
    expect(fixture.componentInstance.getResStage(1)).toBe(3);
    expect(fixture.componentInstance.getHintsCount(99)).toBe(0);
  });
});
