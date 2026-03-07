import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-architecture',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslateModule],
  templateUrl: './architecture.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ArchitectureComponent {}
