import { Route } from '@angular/router';
import { AuthGuard, EmployeeGuard, tenantGuard } from '@pwa/core';
import { PublicLayoutComponent, TenantAdminLayoutComponent } from '@pwa/shared';

export const appRoutes: Route[] = [
  // Rutas que REQUIEREN tenant activo (tienda pública)
  {
    path: '',
    component: PublicLayoutComponent,
    canActivate: [tenantGuard],
    children: [
      // Home/Catálogo como página principal del tenant
      {
        path: '',
        loadChildren: () => import('@pwa/catalog').then((m) => m.catalogRoutes),
      },
      {
        path: 'catalog',
        loadChildren: () => import('@pwa/catalog').then((m) => m.catalogRoutes),
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
        path: 'loyalty',
        canActivate: [AuthGuard],
        loadChildren: () => import('@pwa/catalog').then((m) => m.loyaltyRoutes),
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
    component: TenantAdminLayoutComponent,
    canActivate: [AuthGuard, EmployeeGuard],
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
