import { Route } from '@angular/router';

export { catalogRoutes } from './catalog/catalog.routes';

/**
 * 💎 Rutas del Programa de Lealtad (Usuario)
 *
 * Permite a los usuarios gestionar sus puntos, canjear premios
 * y ver su historial de transacciones
 */
export const loyaltyRoutes: Route[] = [
  {
    path: '',
    redirectTo: 'account',
    pathMatch: 'full',
  },
  {
    path: 'account',
    loadComponent: () =>
      import(
        './loyalty/pages/loyalty-dashboard-page/loyalty-dashboard-page.component'
      ).then((m) => m.LoyaltyDashboardPageComponent),
    data: {
      title: 'Mi Cuenta de Lealtad',
    },
  },
  {
    path: 'dashboard',
    loadComponent: () =>
      import(
        './loyalty/pages/loyalty-dashboard-page/loyalty-dashboard-page.component'
      ).then((m) => m.LoyaltyDashboardPageComponent),
    data: {
      title: 'Mi Cuenta de Lealtad',
    },
  },
  {
    path: 'transactions',
    loadComponent: () =>
      import(
        './loyalty/pages/loyalty-transactions-history-page/loyalty-transactions-history-page.component'
      ).then((m) => m.LoyaltyTransactionsHistoryPageComponent),
    data: {
      title: 'Historial de Puntos',
    },
  },
  {
    path: 'transactions-legacy',
    loadComponent: () =>
      import(
        './loyalty/pages/transactions-history/transactions-history.component'
      ).then((m) => m.TransactionsHistoryComponent),
    data: {
      title: 'Historial de Puntos (Legacy)',
    },
  },
  {
    path: 'legacy-account',
    loadComponent: () =>
      import('./loyalty/pages/loyalty-account/loyalty-account.component').then(
        (m) => m.LoyaltyAccountComponent
      ),
    data: {
      title: 'Mi Cuenta de Lealtad',
    },
  },
  {
    path: 'rewards',
    loadComponent: () =>
      import('./loyalty/pages/rewards-catalog/rewards-catalog.component').then(
        (m) => m.RewardsCatalogComponent
      ),
    data: {
      title: 'Catálogo de Premios',
    },
  },
  {
    path: 'redemptions',
    loadComponent: () =>
      import(
        './loyalty/pages/loyalty-redemptions-page/loyalty-redemptions-page.component'
      ).then((m) => m.LoyaltyRedemptionsPageComponent),
    data: {
      title: 'Mis Premios',
    },
  },
];
