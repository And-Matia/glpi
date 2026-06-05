import { Routes } from '@angular/router';
import { authGuard } from '@app/core/guards';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('@app/features/store/layout/store-layout/store-layout.component').then(
        (m) => m.StoreLayoutComponent,
      ),
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./features/store/user-select/user-select.component').then(
            (m) => m.UserSelectComponent,
          ),
      },
      {
        path: 'catalog',
        loadComponent: () =>
          import('./features/store/catalog/catalog.component').then((m) => m.CatalogComponent),
      },
      {
        path: 'products/:id',
        loadComponent: () =>
          import('./features/store/product-detail/product-detail.component').then(
            (m) => m.ProductDetailComponent,
          ),
      },
      {
        path: 'cart',
        loadComponent: () =>
          import('./features/store/cart/cart.component').then((m) => m.CartComponent),
      },
      {
        path: 'checkout',
        loadComponent: () =>
          import('./features/store/checkout/checkout.component').then((m) => m.CheckoutComponent),
      },
      {
        path: 'order-confirmation/:id',
        loadComponent: () =>
          import('./features/store/order-confirmation/order-confirmation.component').then(
            (m) => m.OrderConfirmationComponent,
          ),
      },
      {
        path: 'my-orders',
        loadComponent: () =>
          import('./features/store/my-orders/my-orders.component').then((m) => m.MyOrdersComponent),
      },
      {
        path: 'duplicate-order/:id',
        loadComponent: () =>
          import('./features/store/verify-duplication/verify-duplication.component').then(
            (m) => m.VerifyDuplicationComponent,
          ),
      },
      {
        path: 'remove-stocks',
        loadComponent: () =>
          import('./features/store/remove-stocks/remove-stocks.component').then(
            (m) => m.default,
          ),
      },
    ],
  },

  {
    path: 'admin/login',
    loadComponent: () =>
      import('./features/admin/login/login.component').then((m) => m.LoginComponent),
  },

  {
    path: 'admin',
    canActivate: [authGuard],
    canActivateChild: [authGuard],
    loadComponent: () =>
      import('@app/features/admin/layout/admin-layout/admin-layout.component').then(
        (m) => m.AdminLayoutComponent,
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
          import('./features/admin/dashboard/dashboard.component').then(
            (m) => m.DashboardComponent,
          ),
      },
      {
        path: 'import',
        loadComponent: () =>
          import('./features/admin/import/import.component').then((m) => m.ImportComponent),
      },
      {
        path: 'reset',
        loadComponent: () =>
          import('./features/admin/reset/reset.component').then((m) => m.ResetComponent),
      },
      {
        path: 'orders',
        loadComponent: () =>
          import('./features/admin/orders/orders.component').then((m) => m.OrdersComponent),
      },
      {
        path: 'stock',
        loadComponent: () =>
          import('./features/admin/stock/stock.component').then((m) => m.StockComponent),
      },
      {
        path: 'movement',
        redirectTo: 'stock',
      },
      {
        path: 'stats',
        loadComponent: () =>
          import('@app/features/admin/stats/stats.component').then((m) => m.StatsComponent),
      },
    ],
  },

  { path: '**', redirectTo: '' },
];
