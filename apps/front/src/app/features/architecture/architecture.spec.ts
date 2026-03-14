import { TestBed } from '@angular/core/testing';
import { ArchitectureComponent } from './architecture';
import { ArchitectureService } from './architecture.service';
import { TranslateModule } from '@ngx-translate/core';
import { provideRouter } from '@angular/router';

describe('ArchitectureComponent', () => {
  let architectureService: ArchitectureService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ArchitectureComponent, TranslateModule.forRoot()],
      providers: [provideRouter([])]
    }).compileComponents();

    architectureService = TestBed.inject(ArchitectureService);
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(ArchitectureComponent);
    const component = fixture.componentInstance;
    expect(component).toBeTruthy();
  });

  it('should have 5 phases in config', () => {
    const fixture = TestBed.createComponent(ArchitectureComponent);
    const component = fixture.componentInstance;
    expect(component.ARCHITECTURE_CONFIG.length).toBe(5);
  });

  it('should expose hints unlocked map', () => {
    const fixture = TestBed.createComponent(ArchitectureComponent);
    const map = fixture.componentInstance.hintsUnlockedMap();
    expect(map[1]).toBe(0);
    expect(map[5]).toBe(0);
  });

  it('should expose resolution stage map', () => {
    const fixture = TestBed.createComponent(ArchitectureComponent);
    const map = fixture.componentInstance.resolutionStageMap();
    expect(map[1]).toBe(0);
    expect(map[5]).toBe(0);
  });

  it('should unlock hints via service', () => {
    const fixture = TestBed.createComponent(ArchitectureComponent);
    const spy = vi.spyOn(architectureService, 'unlockNextHint');

    fixture.componentInstance.onUnlockHint(1);
    expect(spy).toHaveBeenCalledWith(1, 2); // Phase 1 has 2 hints
  });

  it('should not unlock hints for invalid phaseId', () => {
    const fixture = TestBed.createComponent(ArchitectureComponent);
    const spy = vi.spyOn(architectureService, 'unlockNextHint');

    fixture.componentInstance.onUnlockHint(99);
    expect(spy).not.toHaveBeenCalled();
  });

  it('should advance resolution via service', () => {
    const fixture = TestBed.createComponent(ArchitectureComponent);
    const spy = vi.spyOn(architectureService, 'advanceResolution');

    fixture.componentInstance.onAdvanceRes(3);
    expect(spy).toHaveBeenCalledWith(3);
  });

  it('should reflect updated hints in map', () => {
    const fixture = TestBed.createComponent(ArchitectureComponent);
    architectureService.unlockNextHint(1, 2);
    expect(fixture.componentInstance.hintsUnlockedMap()[1]).toBe(1);
  });

  it('should reflect updated resolution in map', () => {
    const fixture = TestBed.createComponent(ArchitectureComponent);
    architectureService.advanceResolution(2);
    expect(fixture.componentInstance.resolutionStageMap()[2]).toBe(1);
  });
});
