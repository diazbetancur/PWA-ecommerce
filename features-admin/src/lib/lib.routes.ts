import { Route } from '@angular/router';
import { modulePermissionGuard } from '@pwa/core';

export const featuresAdminRoutes: Route[] = [
  // Pantalla de bienvenida / dashboard
  {
    path: '',
    loadComponent: () =>
      import('./components/dashboard-welcome/dashboard-welcome.component').then(
        (m) => m.DashboardWelcomeComponent
      ),
  },
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./components/dashboard-welcome/dashboard-welcome.component').then(
        (m) => m.DashboardWelcomeComponent
      ),
  },

  // === CATEGORÍAS ===
  {
    path: 'categories',
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./pages/categories/categories-list.component').then(
            (m) => m.CategoriesListComponent
          ),
        canActivate: [modulePermissionGuard('CATEGORIES', 'view')],
        data: {
          title: 'Categorías',
        },
      },
      {
        path: 'create',
        loadComponent: () =>
          import('./pages/categories/category-form.component').then(
            (m) => m.CategoryFormComponent
          ),
        canActivate: [modulePermissionGuard('CATEGORIES', 'create')],
        data: {
          title: 'Nueva Categoría',
        },
      },
      {
        path: ':id/edit',
        loadComponent: () =>
          import('./pages/categories/category-form.component').then(
            (m) => m.CategoryFormComponent
          ),
        canActivate: [modulePermissionGuard('CATEGORIES', 'update')],
        data: {
          title: 'Editar Categoría',
        },
      },
    ],
  },

  // Placeholder para futuros módulos
  // === PRODUCTOS ===
  // {
  //   path: 'products',
  //   canActivate: [modulePermissionGuard('PRODUCTS', 'view')],
  //   loadChildren: () => import('./pages/products/products.routes')
  // },

  // === BANNERS ===
  // {
  //   path: 'banners',
  //   canActivate: [modulePermissionGuard('BANNERS', 'view')],
  //   loadChildren: () => import('./pages/banners/banners.routes')
  // },
];
