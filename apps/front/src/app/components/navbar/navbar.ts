import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { LanguageService } from '../../core/services/language.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './navbar.html',
})
export class NavbarComponent {
  langService = inject(LanguageService);

  get languages() {
    return this.langService.languages;
  }

  get currentLang() {
    return this.langService.currentLang;
  }

  changeLang(event: Event): void {
    const selectElement = event.target as HTMLSelectElement;
    this.langService.setLanguage(selectElement.value);
  }
}
