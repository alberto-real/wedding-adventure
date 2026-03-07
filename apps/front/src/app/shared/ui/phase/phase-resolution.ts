import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { PhaseResolutionStep } from '../../../core/models/phase.model';

@Component({
  selector: 'app-phase-resolution',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './phase-resolution.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PhaseResolutionComponent {
  steps = input.required<PhaseResolutionStep[]>();
  stage = input.required<number>();
  
  advance = output<void>();
}
