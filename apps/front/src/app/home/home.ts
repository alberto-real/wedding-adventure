import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslateModule],
  templateUrl: './home.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeComponent {
  sections = [
    {
      id: 'sports',
      icon: '🏆', // Representing Olympic rings/sports
      title: 'HOME.SECTIONS.SPORTS',
      description: 'HOME.SECTIONS.SPORTS_DESC',
      route: '/sports'
    },
    {
      id: 'architecture',
      icon: '🏛️',
      title: 'HOME.SECTIONS.ARCHITECTURE',
      description: 'HOME.SECTIONS.ARCHITECTURE_DESC',
      route: '/architecture'
    },
    {
      id: 'geocaching',
      icon: '📍',
      title: 'HOME.SECTIONS.GEOCACHING',
      description: 'HOME.SECTIONS.GEOCACHING_DESC',
      route: '/geocaching'
    },
    {
      id: 'challenges',
      icon: '🤝',
      title: 'HOME.SECTIONS.CHALLENGES',
      description: 'HOME.SECTIONS.CHALLENGES_DESC',
      route: '/challenges'
    }
  ];
}
