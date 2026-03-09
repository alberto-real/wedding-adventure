import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule, UpperCasePipe } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { LanguageService } from '../../core/services/language.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, TranslateModule, RouterModule, UpperCasePipe],
  templateUrl: './navbar.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NavbarComponent {
  langService = inject(LanguageService);

  get languages() {
    return this.langService.languages;
  }

  selectLanguage(code: string): void {
    this.langService.setLanguage(code);
    (document.activeElement as HTMLElement)?.blur();
  }
}
