import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-geocaching',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslateModule],
  templateUrl: './geocaching.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GeocachingComponent {}
