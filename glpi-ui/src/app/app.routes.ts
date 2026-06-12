import { Routes } from '@angular/router';
import { authGuard } from '@app/core/guards/auth.guard';

export const routes: Routes = [
  {
    path: 'back-office/login',
    loadComponent: () =>
      import('./pages/back-office/login/login.component').then(m => m.LoginComponent),
  },
  {
    path: 'back-office',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/back-office/layout/back-office-layout/back-office-layout.component').then(
        m => m.BackOfficeLayoutComponent,
      ),
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./pages/back-office/dashboard/dashboard.component').then(m => m.DashboardComponent),
      },
      {
        path: 'tickets',
        loadComponent: () =>
          import('./pages/back-office/tickets/ticket-list/ticket-list.component').then(m => m.TicketListComponent),
      },
      {
        path: 'kanban-configuration',
        loadComponent: () =>
          import('@app/pages/back-office/kanban-configuration/kanban-configuration.component').then(m => m.KanbanConfigurationComponent),
      },
      {
        path: 'tickets/:id',
        loadComponent: () =>
          import('./pages/back-office/tickets/ticket-detail/ticket-detail.component').then(m => m.TicketDetailComponent),
      },
      {
        path: 'import',
        loadComponent: () =>
          import('./pages/back-office/import/import.component').then(m => m.ImportComponent),
      },
      {
        path: 'reset',
        loadComponent: () =>
          import('./pages/back-office/reset/reset.component').then(m => m.ResetComponent),
      },
    ],
  },
  {
    path: 'front-office',
    loadComponent: () =>
      import('@app/pages/front-office/layout/front-office-layout/front-office-layout.component').then(
        m => m.FrontOfficeLayoutComponent,
      ),
    children: [
      { path: '', redirectTo: 'items', pathMatch: 'full' },
      {
        path: 'items',
        loadComponent: () =>
          import('./pages/front-office/items/item-list/item-list.component').then(m => m.ItemListComponent),
      },

      {
        path: 'items-costs',
        loadComponent: () =>
          import('./pages/front-office/items/item-list-cost/item-list-cost.component').then(m => m.ItemListCostComponent),
      },
      {
        path: 'tickets/new',
        loadComponent: () =>
          import('./pages/front-office/tickets/ticket-create/ticket-create.component').then(m => m.TicketCreateComponent),
      },
      {
        path: 'tickets/kanban',
        loadComponent: () =>
          import('./pages/front-office/tickets/kanban/kanban.component').then(m => m.KanbanComponent),
      },
    ],
  },
  { path: '', redirectTo: 'front-office', pathMatch: 'full' },
];
