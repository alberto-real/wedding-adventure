import { Route } from '@angular/router';

export const appRoutes: Route[] = [
  {
    path: '',
    loadComponent: () => import('./home/home').then((m) => m.HomeComponent),
  },
  {
    path: 'sports',
    loadComponent: () => import('./features/sports/sports').then((m) => m.SportsComponent),
  },
  {
    path: 'architecture',
    loadComponent: () => import('./features/architecture/architecture').then((m) => m.ArchitectureComponent),
  },
  {
    path: 'geocaching',
    loadComponent: () => import('./features/geocaching/geocaching').then((m) => m.GeocachingComponent),
  },
  {
    path: 'challenges',
    loadComponent: () => import('./features/challenges/challenges').then((m) => m.ChallengesComponent),
  },
  {
    path: 'admin',
    loadComponent: () => import('./features/admin/admin').then((m) => m.AdminComponent),
  },
  {
    path: '**',
    redirectTo: '',
  },
];
