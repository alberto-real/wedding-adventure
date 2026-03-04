import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { TranslateService, TranslateModule } from '@ngx-translate/core'; // Added TranslateModule
import { CommonModule } from '@angular/common'; // Import CommonModule

@Component({
  standalone: true, // App is standalone, so specify here.
  imports: [RouterModule, CommonModule, TranslateModule], // Re-add TranslateModule for pipe availability
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  protected title = 'client';

  constructor(public translate: TranslateService) {
    // The language is already set in app.config.ts via APP_INITIALIZER
    // No need to set it again here, but we can log it.
    console.log('Current language:', this.translate.currentLang);
  }

  changeLang(event: Event) {
    const selectElement = event.target as HTMLSelectElement;
    this.translate.use(selectElement.value);
  }
}
