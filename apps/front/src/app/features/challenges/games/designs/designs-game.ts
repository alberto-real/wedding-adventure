import { Component, ChangeDetectionStrategy } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-designs-game',
  imports: [TranslateModule],
  template: `
    <div class="text-center py-8">
      <div class="text-6xl mb-4">🎨</div>
      <h2 class="text-2xl font-bold">{{ 'CHALLENGES.GAMES.DESIGNS.TITLE' | translate }}</h2>
      <p class="text-base-content/60 mt-2">{{ 'CHALLENGES.GAME_COMING_SOON' | translate }}</p>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DesignsGameComponent {}
