import { Route } from '@angular/router';
import { modulePermissionGuard } from '@pwa/core';
import { loyaltyFeatureGuard, multiStoreFeatureGuard } from './guards';

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
      import('./pages/access/users-list/users-list.component').then(
        (m) => m.UsersListComponent
      ),
    data: {
      title: 'Clientes',
      userSegment: 'customers',
    },
  },

  // === PROGRAMA DE LEALTAD ===
  {
    path: 'loyalty',
    canActivate: [modulePermissionGuard('loyalty'), loyaltyFeatureGuard],
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full',
      },
      {
        path: 'dashboard',
        loadComponent: () =>
          import(
            './pages/loyalty/loyalty-dashboard/loyalty-dashboard.component'
          ).then((m) => m.LoyaltyDashboardComponent),
        data: {
          title: 'Dashboard de Lealtad',
        },
      },
      {
        path: 'rewards',
        loadComponent: () =>
          import('./pages/loyalty/rewards-list/rewards-list.component').then(
            (m) => m.RewardsListComponent
          ),
        data: {
          title: 'Gestión de Premios',
        },
      },
      {
        path: 'redemptions',
        loadComponent: () =>
          import(
            './pages/loyalty/redemptions-list/redemptions-list.component'
          ).then((m) => m.RedemptionsListComponent),
        data: {
          title: 'Canjes de Usuarios',
        },
      },
      {
        path: 'points-adjustment',
        loadComponent: () =>
          import(
            './pages/loyalty/points-adjustment/points-adjustment.component'
          ).then((m) => m.PointsAdjustmentComponent),
        data: {
          title: 'Ajustar Puntos',
        },
      },
      {
        path: 'config',
        loadComponent: () =>
          import(
            './pages/loyalty/program-config/program-config.component'
          ).then((m) => m.ProgramConfigComponent),
        data: {
          title: 'Configuración del Programa',
        },
      },
    ],
  },

  // === CONFIGURACIÓN ===
  {
    path: 'settings',
    canActivate: [modulePermissionGuard('settings')],
    children: [
      {
        path: '',
        loadComponent: () =>
          import(
            './components/dashboard-welcome/dashboard-welcome.component'
          ).then((m) => m.DashboardWelcomeComponent),
        data: {
          title: 'Configuración',
        },
      },
      // Sucursales / Tiendas
      {
        path: 'stores',
        canActivate: [
          modulePermissionGuard('inventory'),
          multiStoreFeatureGuard,
        ],
        children: [
          {
            path: '',
            loadComponent: () =>
              import('./pages/stores/stores-list/stores-list.component').then(
                (m) => m.StoresListComponent
              ),
            data: {
              title: 'Gestión de Sucursales',
            },
          },
          {
            path: 'new',
            loadComponent: () =>
              import('./pages/stores/store-form/store-form.component').then(
                (m) => m.StoreFormComponent
              ),
            data: {
              title: 'Nueva Sucursal',
            },
          },
          {
            path: ':id/edit',
            loadComponent: () =>
              import('./pages/stores/store-form/store-form.component').then(
                (m) => m.StoreFormComponent
              ),
            data: {
              title: 'Editar Sucursal',
            },
          },
          {
            path: 'products/:productId/stock',
            loadComponent: () =>
              import(
                './pages/stores/product-stock-by-stores/product-stock-by-stores.component'
              ).then((m) => m.ProductStockByStoresComponent),
            data: {
              title: 'Stock por Sucursales',
            },
          },
          {
            path: 'migrate-stock',
            loadComponent: () =>
              import(
                './pages/stores/migrate-stock/migrate-stock.component'
              ).then((m) => m.MigrateStockComponent),
            data: {
              title: 'Migrar Stock Legacy',
            },
          },
        ],
      },
    ],
  },

  // === ACCESIBILIDAD (RBAC - Usuarios, Roles y Permisos) ===
  {
    path: 'access',
    canActivate: [modulePermissionGuard('permissions')],
    children: [
      {
        path: '',
        redirectTo: 'users',
        pathMatch: 'full',
      },
      // Usuarios
      {
        path: 'users',
        loadComponent: () =>
          import('./pages/access/users-list/users-list.component').then(
            (m) => m.UsersListComponent
          ),
        data: {
          title: 'Usuarios',
          userSegment: 'staff',
        },
      },
      // Roles
      {
        path: 'roles',
        loadComponent: () =>
          import('./pages/access/roles-list/roles-list.component').then(
            (m) => m.RolesListComponent
          ),
        data: {
          title: 'Roles',
        },
      },
      {
        path: 'roles/:roleId/permissions',
        loadComponent: () =>
          import(
            './pages/access/role-permissions/role-permissions.component'
          ).then((m) => m.RolePermissionsComponent),
        data: {
          title: 'Permisos del Rol',
        },
      },
    ],
  },
];
