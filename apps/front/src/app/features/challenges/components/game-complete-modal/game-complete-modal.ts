import {
  Component,
  ChangeDetectionStrategy,
  input,
  output,
} from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-game-complete-modal',
  imports: [TranslateModule],
  templateUrl: './game-complete-modal.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GameCompleteModalComponent {
  visible = input.required<boolean>();
  messageKey = input.required<string>();
  closed = output<void>();

  close(): void {
    this.closed.emit();
  }
}
