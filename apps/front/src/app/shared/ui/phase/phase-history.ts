import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-phase-history',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './phase-history.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PhaseHistoryComponent {
  historyKey = input<string | undefined>();
}
