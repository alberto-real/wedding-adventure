import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { PhaseHint } from '../../../core/models/phase.model';

@Component({
  selector: 'app-phase-hints',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './phase-hints.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PhaseHintsComponent {
  hints = input.required<PhaseHint[]>();
  unlockedCount = input.required<number>();
  labelKey = input<string>('SPORTS.HINTS_LABEL');
  
  unlock = output<void>();
}
