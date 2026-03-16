import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-toast',
  template: `
    @if (toastService.toasts().length) {
      <div class="toast toast-end toast-bottom z-[100]">
        @for (toast of toastService.toasts(); track toast.id) {
          <div
            class="alert shadow-lg cursor-pointer max-w-sm"
            [class.alert-info]="toast.type === 'info'"
            [class.alert-warning]="toast.type === 'warning'"
            [class.alert-error]="toast.type === 'error'"
            [class.alert-success]="toast.type === 'success'"
            (click)="toastService.dismiss(toast.id)"
          >
            <span class="text-sm">{{ toast.message }}</span>
          </div>
        }
      </div>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToastComponent {
  readonly toastService = inject(ToastService);
}
