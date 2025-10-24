import { Route } from '@angular/router';
import { AdminLayoutComponent, PublicLayoutComponent } from '@pwa/shared';

export const appRoutes: Route[] = [
  {
    path: '',
    component: PublicLayoutComponent,
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'catalog' },
      {
        path: 'catalog',
        loadChildren: () => import('@pwa/catalog').then((m) => m.catalogRoutes),
      },
      {
        path: 'cart',
        loadChildren: () =>
          import('@pwa/features-cart').then((m) => m.featuresCartRoutes),
      },
      {
        path: 'checkout',
        loadChildren: () =>
          import('@pwa/features-checkout').then(
            (m) => m.featuresCheckoutRoutes
          ),
      },
      {
        path: 'account',
        loadChildren: () =>
          import('@pwa/features-account').then((m) => m.featuresAccountRoutes),
      },
      {
        path: 'orders',
        loadChildren: () =>
          import('@pwa/features-orders').then((m) => m.featuresOrdersRoutes),
      },
      {
        path: 'superadmin',
        loadChildren: () =>
          import('@pwa/features-superadmin').then(
            (m) => m.featuresSuperadminRoutes
          ),
      },
    ],
  },
  {
    path: 'admin',
    component: AdminLayoutComponent,
    children: [
      {
        path: '',
        loadChildren: () =>
          import('@pwa/features-admin').then((m) => m.featuresAdminRoutes),
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
