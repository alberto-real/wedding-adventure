import { TestBed } from '@angular/core/testing';
import { ArchitectureService } from './architecture.service';

describe('ArchitectureService', () => {
  let service: ArchitectureService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ArchitectureService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should unlock hints for each phase', () => {
    service.unlockNextHint(1, 1);
    expect(service.phase1HintsUnlocked()).toBe(1);
    service.unlockNextHint(2, 1);
    expect(service.phase2HintsUnlocked()).toBe(1);
  });

  it('should advance resolution stage for each phase', () => {
    service.advanceResolution(1);
    expect(service.phase1ResolutionStage()).toBe(1);
    service.advanceResolution(3);
    expect(service.phase3ResolutionStage()).toBe(1);
  });

  it('should not exceed max stage for hints', () => {
    service.unlockNextHint(1, 1);
    service.unlockNextHint(1, 1);
    expect(service.phase1HintsUnlocked()).toBe(1);
  });

  it('should allow multiple hints if max is higher', () => {
    service.unlockNextHint(1, 2);
    expect(service.phase1HintsUnlocked()).toBe(1);
    service.unlockNextHint(1, 2);
    expect(service.phase1HintsUnlocked()).toBe(2);
  });

  it('should not exceed max stage for resolution', () => {
    service.advanceResolution(1);
    service.advanceResolution(1);
    expect(service.phase1ResolutionStage()).toBe(1);
  });
});
