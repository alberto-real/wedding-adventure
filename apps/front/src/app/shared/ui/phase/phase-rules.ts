import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-phase-rules',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './phase-rules.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PhaseRulesComponent {
  rulesTitleKey = input<string>('SPORTS.RULES_TITLE');
  rules = input<string[] | undefined>();
}
