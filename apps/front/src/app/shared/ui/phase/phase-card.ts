import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { PhaseConfig } from '../../../core/models/phase.model';
import { PhaseHistoryComponent } from './phase-history';
import { PhaseRulesComponent } from './phase-rules';
import { PhaseHintsComponent } from './phase-hints';
import { PhaseResolutionComponent } from './phase-resolution';

@Component({
  selector: 'app-phase-card',
  standalone: true,
  imports: [
    CommonModule, 
    TranslateModule, 
    PhaseHistoryComponent, 
    PhaseRulesComponent, 
    PhaseHintsComponent, 
    PhaseResolutionComponent
  ],
  templateUrl: './phase-card.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PhaseCardComponent {
  config = input.required<PhaseConfig>();
  isDefaultOpen = input<boolean>(false);
  hintsUnlocked = input.required<number>();
  resolutionStage = input.required<number>();

  unlockHint = output<void>();
  advanceResolution = output<void>();
}
