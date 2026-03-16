import {
  Component,
  ChangeDetectionStrategy,
  input,
  output,
} from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-game-rules-modal',
  imports: [TranslateModule],
  templateUrl: './game-rules-modal.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GameRulesModalComponent {
  visible = input.required<boolean>();
  rulesKey = input.required<string>();
  closed = output<void>();

  close(): void {
    this.closed.emit();
  }
}
