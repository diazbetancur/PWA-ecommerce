import { Route } from '@angular/router';
import { AuthGuard, RoleGuard } from '@pwa/core';
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
        canActivate: [AuthGuard],
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
        canActivate: [AuthGuard],
        loadChildren: () =>
          import('@pwa/features-orders').then((m) => m.featuresOrdersRoutes),
      },
      {
        path: 'orders',
        canActivate: [AuthGuard],
        loadChildren: () =>
          import('@pwa/features-orders').then((m) => m.featuresOrdersRoutes),
      },
    ],
  },
  // Módulo de Administración General (Superadmin)
  // Este módulo gestiona TODOS los tenants y configuraciones globales
  // NO requiere tenant específico - trabaja en contexto "general-admin"
  {
    path: 'admin',
    loadChildren: () =>
      import('@pwa/features-superadmin').then((m) => m.ADMIN_ROUTES),
  },
  // Módulo de Administración de Tenant Específico
  // Este módulo gestiona la administración DENTRO de un tenant particular
  {
    path: 'tenant-admin',
    component: AdminLayoutComponent,
    canActivate: [AuthGuard, RoleGuard('admin')],
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
