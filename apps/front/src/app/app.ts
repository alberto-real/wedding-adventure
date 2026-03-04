import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { CommonModule } from '@angular/common';

import { NavbarComponent } from './components/navbar/navbar';

@Component({
  standalone: true,
  imports: [RouterModule, CommonModule, TranslateModule, NavbarComponent],
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  protected title = 'front';
}
