import { Injectable, signal, computed } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class SportsService {
  /**
   * Status of hints for each phase.
   */
  readonly phase1HintsUnlocked = signal(0); // 0 to 3
  readonly phase2HintsUnlocked = signal(0); // 0 to 3
  readonly phase3HintsUnlocked = signal(0); // 0 to 3

  /**
   * Resolution stages for each phase (Independent).
   */
  readonly phase1ResolutionStage = signal(0); // 0 to 4
  readonly phase2ResolutionStage = signal(0); // 0 to 5
  readonly phase3ResolutionStage = signal(0); // 0 to 4

  /**
   * Computed signal to check if all hints in the game have been used.
   */
  readonly allHintsUsed = computed(() => {
    return (
      this.phase1HintsUnlocked() === 3 &&
      this.phase2HintsUnlocked() === 3 &&
      this.phase3HintsUnlocked() === 3
    );
  });

  unlockNextPhase1Hint(): void {
    if (this.phase1HintsUnlocked() < 3) {
      this.phase1HintsUnlocked.update((v) => v + 1);
    }
  }

  unlockNextPhase2Hint(): void {
    if (this.phase2HintsUnlocked() < 3) {
      this.phase2HintsUnlocked.update((v) => v + 1);
    }
  }

  unlockNextPhase3Hint(): void {
    if (this.phase3HintsUnlocked() < 3) {
      this.phase3HintsUnlocked.update((v) => v + 1);
    }
  }

  advancePhase1Resolution(): void {
    if (this.phase1ResolutionStage() < 4) {
      this.phase1ResolutionStage.update((s) => s + 1);
    }
  }

  advancePhase2Resolution(): void {
    if (this.phase2ResolutionStage() < 5) {
      this.phase2ResolutionStage.update((s) => s + 1);
    }
  }

  advancePhase3Resolution(): void {
    if (this.phase3ResolutionStage() < 4) {
      this.phase3ResolutionStage.update((s) => s + 1);
    }
  }
}
