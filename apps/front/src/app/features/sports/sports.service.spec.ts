import { TestBed } from '@angular/core/testing';
import { SportsService } from './sports.service';

describe('SportsService', () => {
  let service: SportsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SportsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should unlock hints correctly for each phase', () => {
    service.unlockNextPhase1Hint();
    expect(service.phase1HintsUnlocked()).toBe(1);
    service.unlockNextPhase2Hint();
    expect(service.phase2HintsUnlocked()).toBe(1);
    service.unlockNextPhase3Hint();
    expect(service.phase3HintsUnlocked()).toBe(1);
  });

  it('should not exceed max hints for phase 1 (3)', () => {
    for (let i = 0; i < 5; i++) {
      service.unlockNextPhase1Hint();
    }
    expect(service.phase1HintsUnlocked()).toBe(3);
  });

  it('should not exceed max hints for phase 2 (3)', () => {
    for (let i = 0; i < 5; i++) {
      service.unlockNextPhase2Hint();
    }
    expect(service.phase2HintsUnlocked()).toBe(3);
  });

  it('should not exceed max hints for phase 3 (3)', () => {
    for (let i = 0; i < 5; i++) {
      service.unlockNextPhase3Hint();
    }
    expect(service.phase3HintsUnlocked()).toBe(3);
  });

  it('should advance resolution stage correctly', () => {
    service.advancePhase1Resolution();
    expect(service.phase1ResolutionStage()).toBe(1);
    service.advancePhase2Resolution();
    expect(service.phase2ResolutionStage()).toBe(1);
    service.advancePhase3Resolution();
    expect(service.phase3ResolutionStage()).toBe(1);
  });

  it('should not exceed max resolution for phase 1 (4)', () => {
    for (let i = 0; i < 6; i++) {
      service.advancePhase1Resolution();
    }
    expect(service.phase1ResolutionStage()).toBe(4);
  });

  it('should not exceed max resolution for phase 2 (5)', () => {
    for (let i = 0; i < 7; i++) {
      service.advancePhase2Resolution();
    }
    expect(service.phase2ResolutionStage()).toBe(5);
  });

  it('should not exceed max resolution for phase 3 (4)', () => {
    for (let i = 0; i < 6; i++) {
      service.advancePhase3Resolution();
    }
    expect(service.phase3ResolutionStage()).toBe(4);
  });

  it('should detect when all hints are used', () => {
    expect(service.allHintsUsed()).toBe(false);
    for (let i = 0; i < 3; i++) {
      service.unlockNextPhase1Hint();
      service.unlockNextPhase2Hint();
      service.unlockNextPhase3Hint();
    }
    expect(service.allHintsUsed()).toBe(true);
  });
});
