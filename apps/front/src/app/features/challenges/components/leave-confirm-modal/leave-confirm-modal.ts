import {
  Component,
  ChangeDetectionStrategy,
  input,
  output,
} from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-leave-confirm-modal',
  imports: [TranslateModule],
  templateUrl: './leave-confirm-modal.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LeaveConfirmModalComponent {
  visible = input.required<boolean>();
  confirmed = output<void>();
  cancelled = output<void>();

  confirm(): void {
    this.confirmed.emit();
  }

  cancel(): void {
    this.cancelled.emit();
  }
}
