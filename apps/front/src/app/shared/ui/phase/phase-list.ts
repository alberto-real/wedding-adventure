import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PhaseConfig } from '../../../core/models/phase.model';
import { PhaseCardComponent } from './phase-card';

@Component({
  selector: 'app-phase-list',
  standalone: true,
  imports: [CommonModule, PhaseCardComponent],
  templateUrl: './phase-list.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PhaseListComponent {
  config = input.required<PhaseConfig[]>();
  
  // Mapeo de estados externos
  hintsUnlockedMap = input.required<Record<number, number>>();
  resolutionStageMap = input.required<Record<number, number>>();

  unlockHint = output<number>();
  advanceResolution = output<number>();

  getHintsCount(id: number): number {
    return this.hintsUnlockedMap()[id] || 0;
  }

  getResStage(id: number): number {
    return this.resolutionStageMap()[id] || 0;
  }
}
