import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { LanguageService } from '../../core/services/language.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './navbar.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NavbarComponent {
  langService = inject(LanguageService);

  get languages() {
    return this.langService.languages;
  }

  changeLang(event: Event): void {
    const selectElement = event.target as HTMLSelectElement;
    this.langService.setLanguage(selectElement.value);
  }
}
