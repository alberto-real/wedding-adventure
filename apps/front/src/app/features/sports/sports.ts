import { Component, ChangeDetectionStrategy, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { SportsService } from './sports.service';
import { PhaseListComponent } from '../../shared/ui/phase/phase-list';
import { PhaseConfig } from '../../core/models/phase.model';

@Component({
  selector: 'app-sports',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslateModule, PhaseListComponent],
  templateUrl: './sports.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SportsComponent {
  private sportsService = inject(SportsService);

  // Mapas reactivos para la lista
  hintsUnlockedMap = computed(() => ({
    1: this.sportsService.phase1HintsUnlocked(),
    2: this.sportsService.phase2HintsUnlocked(),
    3: this.sportsService.phase3HintsUnlocked(),
  }));

  resolutionStageMap = computed(() => ({
    1: this.sportsService.phase1ResolutionStage(),
    2: this.sportsService.phase2ResolutionStage(),
    3: this.sportsService.phase3ResolutionStage(),
  }));

  readonly SPORTS_CONFIG: PhaseConfig[] = [
    {
      id: 1,
      titleKey: 'SPORTS.PHASE1_TITLE',
      badgeLabel: 'A & B',
      historyKey: 'SPORTS.HISTORY',
      rules: ['SPORTS.RULE_1', 'SPORTS.RULE_2', 'SPORTS.RULE_3'],
      hints: [
        { labelKey: 'SPORTS.PHASE1_HINT1', url: 'https://uabarbera.com/', urlLabel: 'uabarbera.com' },
        { labelKey: 'SPORTS.PHASE1_HINT2' },
        { labelKey: 'SPORTS.PHASE1_HINT3' }
      ],
      resolutionSteps: [
        { labelKey: 'SPORTS.RESOLVE_ANNA_MARK', isMono: true },
        { labelKey: 'SPORTS.RESOLVE_ALBERTO_MARK', isMono: true },
        { labelKey: 'SPORTS.RESOLVE_A', isBold: true },
        { labelKey: 'SPORTS.RESOLVE_B', isBold: true }
      ]
    },
    {
      id: 2,
      titleKey: 'SPORTS.PHASE2_TITLE',
      badgeLabel: 'R',
      historyKey: 'SPORTS.HISTORY_PHASE2',
      rules: ['SPORTS.RULE_PHASE2'],
      hints: [
        { labelKey: 'SPORTS.PHASE2_HINT1' },
        { labelKey: 'SPORTS.PHASE2_HINT2' },
        { labelKey: 'SPORTS.PHASE2_HINT3' }
      ],
      resolutionSteps: [
        { labelKey: 'SPORTS.RESOLVE_ANNA_ROCK_GRADE', isMono: true },
        { labelKey: 'SPORTS.RESOLVE_ANNA_ROCK_PTS' },
        { labelKey: 'SPORTS.RESOLVE_ALBERTO_ROCK_GRADE', isMono: true },
        { labelKey: 'SPORTS.RESOLVE_ALBERTO_ROCK_PTS' },
        { labelKey: 'SPORTS.RESOLVE_R', isBold: true }
      ]
    },
    {
      id: 3,
      titleKey: 'SPORTS.PHASE3_TITLE',
      badgeLabel: 'D & M',
      historyKey: 'SPORTS.HISTORY_PHASE3',
      hints: [
        { labelKey: 'SPORTS.PHASE3_HINT1' },
        { labelKey: 'SPORTS.PHASE3_HINT2' },
        { labelKey: 'SPORTS.PHASE3_HINT3' }
      ],
      resolutionSteps: [
        { labelKey: 'SPORTS.RESOLVE_DATE_HINT' },
        { labelKey: 'SPORTS.RESOLVE_DAY' },
        { labelKey: 'SPORTS.RESOLVE_MONTH' },
        { labelKey: 'SPORTS.RESOLVE_DATE', isBold: true }
      ]
    }
  ];

  onUnlockHint(phaseId: number): void {
    if (phaseId === 1) this.sportsService.unlockNextPhase1Hint();
    if (phaseId === 2) this.sportsService.unlockNextPhase2Hint();
    if (phaseId === 3) this.sportsService.unlockNextPhase3Hint();
  }

  onAdvanceRes(phaseId: number): void {
    if (phaseId === 1) this.sportsService.advancePhase1Resolution();
    if (phaseId === 2) this.sportsService.advancePhase2Resolution();
    if (phaseId === 3) this.sportsService.advancePhase3Resolution();
  }
}
