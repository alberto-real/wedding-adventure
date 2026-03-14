import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class ArchitectureService {
  /**
   * Status of hints for each phase.
   */
  readonly phase1HintsUnlocked = signal(0);
  readonly phase2HintsUnlocked = signal(0);
  readonly phase3HintsUnlocked = signal(0);
  readonly phase4HintsUnlocked = signal(0);
  readonly phase5HintsUnlocked = signal(0);

  /**
   * Resolution stages for each phase.
   */
  readonly phase1ResolutionStage = signal(0);
  readonly phase2ResolutionStage = signal(0);
  readonly phase3ResolutionStage = signal(0);
  readonly phase4ResolutionStage = signal(0);
  readonly phase5ResolutionStage = signal(0);

  unlockNextHint(phaseId: number): void {
    const signalMap: Record<number, any> = {
      1: this.phase1HintsUnlocked,
      2: this.phase2HintsUnlocked,
      3: this.phase3HintsUnlocked,
      4: this.phase4HintsUnlocked,
      5: this.phase5HintsUnlocked,
    };
    if (signalMap[phaseId] && signalMap[phaseId]() < 1) {
      signalMap[phaseId].update((v: number) => v + 1);
    }
  }

  advanceResolution(phaseId: number): void {
    const signalMap: Record<number, any> = {
      1: this.phase1ResolutionStage,
      2: this.phase2ResolutionStage,
      3: this.phase3ResolutionStage,
      4: this.phase4ResolutionStage,
      5: this.phase5ResolutionStage,
    };
    if (signalMap[phaseId] && signalMap[phaseId]() < 1) {
      signalMap[phaseId].update((s: number) => s + 1);
    }
  }
}
