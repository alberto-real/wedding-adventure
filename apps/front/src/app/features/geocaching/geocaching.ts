import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-geocaching',
  imports: [RouterModule, TranslateModule],
  templateUrl: './geocaching.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GeocachingComponent {}
