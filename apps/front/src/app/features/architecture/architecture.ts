import { Component, ChangeDetectionStrategy, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { ArchitectureService } from './architecture.service';
import { PhaseListComponent } from '../../shared/ui/phase/phase-list';
import { PhaseConfig } from '../../core/models/phase.model';

@Component({
  selector: 'app-architecture',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslateModule, PhaseListComponent],
  templateUrl: './architecture.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ArchitectureComponent {
  private architectureService = inject(ArchitectureService);

  hintsUnlockedMap = computed(() => ({
    1: this.architectureService.phase1HintsUnlocked(),
    2: this.architectureService.phase2HintsUnlocked(),
    3: this.architectureService.phase3HintsUnlocked(),
    4: this.architectureService.phase4HintsUnlocked(),
    5: this.architectureService.phase5HintsUnlocked(),
  }));

  resolutionStageMap = computed(() => ({
    1: this.architectureService.phase1ResolutionStage(),
    2: this.architectureService.phase2ResolutionStage(),
    3: this.architectureService.phase3ResolutionStage(),
    4: this.architectureService.phase4ResolutionStage(),
    5: this.architectureService.phase5ResolutionStage(),
  }));

  readonly ARCHITECTURE_CONFIG: PhaseConfig[] = [
    {
      id: 1,
      titleKey: 'ARCHITECTURE.PHASE1_TITLE',
      historyKey: 'ARCHITECTURE.PHASE1_DESC',
      hints: [
        { labelKey: 'ARCHITECTURE.HINT_MIES_ARCHITECT' },
        { labelKey: 'ARCHITECTURE.HINT_MIES_BUILDING' }
      ],
      resolutionSteps: [{ labelKey: 'ARCHITECTURE.RESOLVE_MIES', isBold: true }],
    },
    {
      id: 2,
      titleKey: 'ARCHITECTURE.PHASE2_TITLE',
      historyKey: 'ARCHITECTURE.PHASE2_DESC',
      hints: [{ labelKey: 'ARCHITECTURE.HINT_KAHN' }],
      resolutionSteps: [{ labelKey: 'ARCHITECTURE.RESOLVE_KAHN', isBold: true }],
    },
    {
      id: 3,
      titleKey: 'ARCHITECTURE.PHASE3_TITLE',
      historyKey: 'ARCHITECTURE.PHASE3_DESC',
      hints: [
        { labelKey: 'ARCHITECTURE.HINT_AALTO_ARCHITECT' },
        { labelKey: 'ARCHITECTURE.HINT_AALTO_ELEMENT' }
      ],
      resolutionSteps: [{ labelKey: 'ARCHITECTURE.RESOLVE_AALTO', isBold: true }],
    },
    {
      id: 4,
      titleKey: 'ARCHITECTURE.PHASE4_TITLE',
      historyKey: 'ARCHITECTURE.PHASE4_DESC',
      hints: [
        { labelKey: 'ARCHITECTURE.HINT_CORBU_ARCHITECT' },
        { labelKey: 'ARCHITECTURE.HINT_CORBU_BUILDING' }
      ],
      resolutionSteps: [{ labelKey: 'ARCHITECTURE.RESOLVE_CORBU', isBold: true }],
    },
    {
      id: 5,
      titleKey: 'ARCHITECTURE.PHASE5_TITLE',
      historyKey: 'ARCHITECTURE.PHASE5_DESC',
      hints: [
        { labelKey: 'ARCHITECTURE.HINT_WRIGHT_ARCHITECT' },
        { labelKey: 'ARCHITECTURE.HINT_WRIGHT_BUILDING' }
      ],
      resolutionSteps: [{ labelKey: 'ARCHITECTURE.RESOLVE_WRIGHT', isBold: true }],
    },
  ];

  onUnlockHint(phaseId: number): void {
    const config = this.ARCHITECTURE_CONFIG.find(p => p.id === phaseId);
    if (config) {
      this.architectureService.unlockNextHint(phaseId, config.hints.length);
    }
  }

  onAdvanceRes(phaseId: number): void {
    this.architectureService.advanceResolution(phaseId);
  }
}
