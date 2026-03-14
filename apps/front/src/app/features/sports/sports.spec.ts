import { TestBed } from '@angular/core/testing';
import { SportsComponent } from './sports';
import { TranslateModule } from '@ngx-translate/core';
import { SportsService } from './sports.service';
import { provideRouter } from '@angular/router';

describe('SportsComponent', () => {
  let sportsService: SportsService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SportsComponent, TranslateModule.forRoot()],
      providers: [provideRouter([]), SportsService]
    }).compileComponents();

    sportsService = TestBed.inject(SportsService);
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(SportsComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should have 3 phases in config', () => {
    const fixture = TestBed.createComponent(SportsComponent);
    expect(fixture.componentInstance.SPORTS_CONFIG.length).toBe(3);
  });

  it('should call service when unlocking hints', () => {
    const fixture = TestBed.createComponent(SportsComponent);
    const spy1 = vi.spyOn(sportsService, 'unlockNextPhase1Hint');
    const spy2 = vi.spyOn(sportsService, 'unlockNextPhase2Hint');
    const spy3 = vi.spyOn(sportsService, 'unlockNextPhase3Hint');

    fixture.componentInstance.onUnlockHint(1);
    expect(spy1).toHaveBeenCalled();
    fixture.componentInstance.onUnlockHint(2);
    expect(spy2).toHaveBeenCalled();
    fixture.componentInstance.onUnlockHint(3);
    expect(spy3).toHaveBeenCalled();
  });

  it('should not call service for invalid phaseId unlock', () => {
    const fixture = TestBed.createComponent(SportsComponent);
    const spy1 = vi.spyOn(sportsService, 'unlockNextPhase1Hint');
    const spy2 = vi.spyOn(sportsService, 'unlockNextPhase2Hint');
    const spy3 = vi.spyOn(sportsService, 'unlockNextPhase3Hint');

    fixture.componentInstance.onUnlockHint(99);
    expect(spy1).not.toHaveBeenCalled();
    expect(spy2).not.toHaveBeenCalled();
    expect(spy3).not.toHaveBeenCalled();
  });

  it('should call service when advancing resolution', () => {
    const fixture = TestBed.createComponent(SportsComponent);
    const spy1 = vi.spyOn(sportsService, 'advancePhase1Resolution');
    const spy2 = vi.spyOn(sportsService, 'advancePhase2Resolution');
    const spy3 = vi.spyOn(sportsService, 'advancePhase3Resolution');

    fixture.componentInstance.onAdvanceRes(1);
    expect(spy1).toHaveBeenCalled();
    fixture.componentInstance.onAdvanceRes(2);
    expect(spy2).toHaveBeenCalled();
    fixture.componentInstance.onAdvanceRes(3);
    expect(spy3).toHaveBeenCalled();
  });

  it('should not call service for invalid phaseId resolution', () => {
    const fixture = TestBed.createComponent(SportsComponent);
    const spy1 = vi.spyOn(sportsService, 'advancePhase1Resolution');
    const spy2 = vi.spyOn(sportsService, 'advancePhase2Resolution');
    const spy3 = vi.spyOn(sportsService, 'advancePhase3Resolution');

    fixture.componentInstance.onAdvanceRes(99);
    expect(spy1).not.toHaveBeenCalled();
    expect(spy2).not.toHaveBeenCalled();
    expect(spy3).not.toHaveBeenCalled();
  });

  it('should expose hints unlocked map', () => {
    const fixture = TestBed.createComponent(SportsComponent);
    const map = fixture.componentInstance.hintsUnlockedMap();
    expect(map[1]).toBe(0);
    expect(map[2]).toBe(0);
    expect(map[3]).toBe(0);
  });

  it('should expose resolution stage map', () => {
    const fixture = TestBed.createComponent(SportsComponent);
    const map = fixture.componentInstance.resolutionStageMap();
    expect(map[1]).toBe(0);
    expect(map[2]).toBe(0);
    expect(map[3]).toBe(0);
  });

  it('should reflect updated values in maps', () => {
    const fixture = TestBed.createComponent(SportsComponent);
    sportsService.unlockNextPhase1Hint();
    sportsService.advancePhase2Resolution();

    expect(fixture.componentInstance.hintsUnlockedMap()[1]).toBe(1);
    expect(fixture.componentInstance.resolutionStageMap()[2]).toBe(1);
  });
});
