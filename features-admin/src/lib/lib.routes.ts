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

  // === CATÁLOGO (incluye categorías, productos, etc) ===
  {
    path: 'catalog',
    children: [
      {
        path: '',
        redirectTo: 'categories',
        pathMatch: 'full',
      },
      // Categorías
      {
        path: 'categories',
        loadComponent: () =>
          import(
            './pages/categories/categories-list/categories-list.component'
          ).then((m) => m.CategoriesListComponent),
        canActivate: [modulePermissionGuard('catalog')],
        data: {
          title: 'Categorías',
        },
      },
      {
        path: 'categories/create',
        loadComponent: () =>
          import(
            './pages/categories/categories-form/category-form.component'
          ).then((m) => m.CategoryFormComponent),
        canActivate: [modulePermissionGuard('catalog')],
        data: {
          title: 'Nueva Categoría',
        },
      },
      {
        path: 'categories/:id/edit',
        loadComponent: () =>
          import(
            './pages/categories/categories-form/category-form.component'
          ).then((m) => m.CategoryFormComponent),
        canActivate: [modulePermissionGuard('catalog')],
        data: {
          title: 'Editar Categoría',
        },
      },
      // Productos
      {
        path: 'products',
        loadComponent: () =>
          import('./pages/products/products-list/products-list.component').then(
            (m) => m.ProductsListComponent
          ),
        canActivate: [modulePermissionGuard('catalog')],
        data: {
          title: 'Productos',
        },
      },
      {
        path: 'products/create',
        loadComponent: () =>
          import('./pages/products/products-form/product-form.component').then(
            (m) => m.ProductFormComponent
          ),
        canActivate: [modulePermissionGuard('catalog')],
        data: {
          title: 'Nuevo Producto',
        },
      },
      {
        path: 'products/edit/:id',
        loadComponent: () =>
          import('./pages/products/products-form/product-form.component').then(
            (m) => m.ProductFormComponent
          ),
        canActivate: [modulePermissionGuard('catalog')],
        data: {
          title: 'Editar Producto',
        },
      },
    ],
  },

  // === PEDIDOS ===
  {
    path: 'orders',
    canActivate: [modulePermissionGuard('orders')],
    loadComponent: () =>
      import('./components/dashboard-welcome/dashboard-welcome.component').then(
        (m) => m.DashboardWelcomeComponent
      ),
    data: {
      title: 'Pedidos',
    },
  },

  // === CLIENTES ===
  {
    path: 'customers',
    canActivate: [modulePermissionGuard('customers')],
    loadComponent: () =>
      import('./components/dashboard-welcome/dashboard-welcome.component').then(
        (m) => m.DashboardWelcomeComponent
      ),
    data: {
      title: 'Clientes',
    },
  },

  // === PROGRAMA DE LEALTAD ===
  {
    path: 'loyalty',
    canActivate: [modulePermissionGuard('loyalty')],
    loadComponent: () =>
      import('./components/dashboard-welcome/dashboard-welcome.component').then(
        (m) => m.DashboardWelcomeComponent
      ),
    data: {
      title: 'Programa de Lealtad',
    },
  },

  // === CONFIGURACIÓN ===
  {
    path: 'settings',
    canActivate: [modulePermissionGuard('settings')],
    loadComponent: () =>
      import('./components/dashboard-welcome/dashboard-welcome.component').then(
        (m) => m.DashboardWelcomeComponent
      ),
    data: {
      title: 'Configuración',
    },
  },

  // === PERMISOS ===
  {
    path: 'permissions',
    canActivate: [modulePermissionGuard('permissions')],
    loadComponent: () =>
      import('./components/dashboard-welcome/dashboard-welcome.component').then(
        (m) => m.DashboardWelcomeComponent
      ),
    data: {
      title: 'Permisos',
    },
  },
];
