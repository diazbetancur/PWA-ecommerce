import { Route } from '@angular/router';
import { AuthGuard, RoleGuard, tenantGuard } from '@pwa/core';
import { AdminLayoutComponent, PublicLayoutComponent } from '@pwa/shared';

export const appRoutes: Route[] = [
  // Redirect por defecto a /admin si no hay tenant
  { path: '', pathMatch: 'full', redirectTo: 'admin' },

  // Rutas que REQUIEREN tenant activo
  {
    path: '',
    component: PublicLayoutComponent,
    canActivate: [tenantGuard], // 🔐 Requiere tenant - si no hay, redirige a /admin
    children: [
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
