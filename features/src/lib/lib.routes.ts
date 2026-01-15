import { Route } from '@angular/router';
import { CatalogPageComponent, CategoriesPageComponent } from './catalog/pages';

export const catalogRoutes: Route[] = [
  { path: '', component: CatalogPageComponent },
  { path: 'categories', component: CategoriesPageComponent },
];

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
      import('./loyalty/pages/my-redemptions/my-redemptions.component').then(
        (m) => m.MyRedemptionsComponent
      ),
    data: {
      title: 'Mis Canjes',
    },
  },
  {
    path: 'transactions',
    loadComponent: () =>
      import(
        './loyalty/pages/transactions-history/transactions-history.component'
      ).then((m) => m.TransactionsHistoryComponent),
    data: {
      title: 'Historial de Puntos',
    },
  },
];
