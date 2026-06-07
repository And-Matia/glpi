import { Routes } from '@angular/router';
import { authGuard } from '@app/core/guards/auth.guard';

export const routes: Routes = [
  {
    path: 'back-office/login',
    loadComponent: () =>
      import('./features/back-office/login/login.component').then(m => m.LoginComponent),
  },
  {
    path: 'back-office',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/back-office/layout/back-office-layout/back-office-layout.component').then(
        m => m.BackOfficeLayoutComponent,
      ),
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/back-office/dashboard/dashboard.component').then(m => m.DashboardComponent),
      },
      {
        path: 'tickets',
        loadComponent: () =>
          import('./features/back-office/tickets/ticket-list/ticket-list.component').then(m => m.TicketListComponent),
      },
      {
        path: 'tickets/:id',
        loadComponent: () =>
          import('./features/back-office/tickets/ticket-detail/ticket-detail.component').then(m => m.TicketDetailComponent),
      },
      {
        path: 'import',
        loadComponent: () =>
          import('./features/back-office/import/import.component').then(m => m.ImportComponent),
      },
      {
        path: 'reset',
        loadComponent: () =>
          import('./features/back-office/reset/reset.component').then(m => m.ResetComponent),
      },
    ],
  },
  {
    path: 'front-office',
    loadComponent: () =>
      import('./features/front-office/layout/front-office-layout/front-office-layout.component').then(
        m => m.FrontOfficeLayoutComponent,
      ),
    children: [
      { path: '', redirectTo: 'items', pathMatch: 'full' },
      {
        path: 'items',
        loadComponent: () =>
          import('./features/front-office/items/item-list/item-list.component').then(m => m.ItemListComponent),
      },
      {
        path: 'tickets/new',
        loadComponent: () =>
          import('./features/front-office/tickets/ticket-create/ticket-create.component').then(m => m.TicketCreateComponent),
      },
    ],
  },
  { path: '', redirectTo: 'front-office', pathMatch: 'full' },
];
