import {Routes} from '@angular/router';
import {authGuard} from '@app/core/guards/auth.guard';

export const routes: Routes = [
  {
    path: 'back-office/login',
    loadComponent: () =>
      import('./features/back-office/login/login.component').then((m) => m.LoginComponent),
  },

  {
    path: 'back-office',
    canActivate: [authGuard],
    loadComponent: () =>
      import('@app/features/back-office/layout/back-office-layout/back-office-layout.component').then(
        (m) => m.BackOfficeLayoutComponent,
      ),
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full',
      },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/back-office/dashboard/dashboard.component').then(
            (m) => m.DashboardComponent,
          ),
      },
      {
        path: 'import',
        loadComponent: () =>
          import('./features/back-office/import/import.component').then((m) => m.ImportComponent),
      },
      {
        path: 'reset',
        loadComponent: () =>
          import('./features/back-office/reset/reset.component').then((m) => m.ResetComponent),
      },
    ],
  },
];
