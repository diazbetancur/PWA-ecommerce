/**
 * 🛣️ Ejemplo de Configuración de Rutas para Panel Administrativo del Tenant
 *
 * Este archivo muestra cómo estructurar las rutas del panel administrativo
 * con guards de permisos basados en módulos.
 *
 * IMPORTANTE:
 * - Solo usuarios con userType='tenant_user' y roles admin pueden acceder
 * - Los clientes (userType='customer') NO ven estas rutas
 * - Cada ruta verifica permisos específicos del módulo
 */

import { Routes } from '@angular/router';
import { authGuard, modulePermissionGuard, tenantAdminGuard } from '@pwa/core';

export const TENANT_ADMIN_ROUTES: Routes = [
  {
    path: 'admin',
    canActivate: [authGuard, tenantAdminGuard], // ← Verifica que sea admin del tenant
    loadComponent: () =>
      import(
        '@pwa/shared/layouts/tenant-admin-layout/tenant-admin-layout.component'
      ).then((m) => m.TenantAdminLayoutComponent),
    children: [
      // Dashboard (sin permisos específicos, todos los admins lo ven)
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full',
      },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./pages/dashboard/dashboard.component').then(
            (m) => m.DashboardComponent
          ),
      },

      // === CONFIGURACIÓN (agrupados bajo el mismo menú) ===

      // Categorías
      {
        path: 'categories',
        canActivate: [modulePermissionGuard('CATEGORIES', 'view')],
        loadComponent: () =>
          import('./pages/categories/categories-list.component').then(
            (m) => m.CategoriesListComponent
          ),
      },
      {
        path: 'categories/create',
        canActivate: [modulePermissionGuard('CATEGORIES', 'create')],
        loadComponent: () =>
          import('./pages/categories/category-create.component').then(
            (m) => m.CategoryCreateComponent
          ),
      },
      {
        path: 'categories/:id/edit',
        canActivate: [modulePermissionGuard('CATEGORIES', 'update')],
        loadComponent: () =>
          import('./pages/categories/category-edit.component').then(
            (m) => m.CategoryEditComponent
          ),
      },

      // Productos
      {
        path: 'products',
        canActivate: [modulePermissionGuard('PRODUCTS', 'view')],
        loadComponent: () =>
          import('./pages/products/products-list.component').then(
            (m) => m.ProductsListComponent
          ),
      },
      {
        path: 'products/create',
        canActivate: [modulePermissionGuard('PRODUCTS', 'create')],
        loadComponent: () =>
          import('./pages/products/product-create.component').then(
            (m) => m.ProductCreateComponent
          ),
      },
      {
        path: 'products/:id/edit',
        canActivate: [modulePermissionGuard('PRODUCTS', 'update')],
        loadComponent: () =>
          import('./pages/products/product-edit.component').then(
            (m) => m.ProductEditComponent
          ),
      },

      // Banners
      {
        path: 'banners',
        canActivate: [modulePermissionGuard('BANNERS', 'view')],
        loadComponent: () =>
          import('./pages/banners/banners-list.component').then(
            (m) => m.BannersListComponent
          ),
      },

      // === VENTAS ===

      // Órdenes/Ventas
      {
        path: 'orders',
        canActivate: [modulePermissionGuard('ORDERS', 'view')],
        children: [
          {
            path: '',
            loadComponent: () =>
              import('./pages/orders/orders-list.component').then(
                (m) => m.OrdersListComponent
              ),
          },
          {
            path: ':id',
            loadComponent: () =>
              import('./pages/orders/order-detail.component').then(
                (m) => m.OrderDetailComponent
              ),
          },
        ],
      },

      // === MÉTRICAS (TODO) ===
      {
        path: 'metrics',
        canActivate: [modulePermissionGuard('METRICS', 'view')],
        loadComponent: () =>
          import('./pages/metrics/metrics.component').then(
            (m) => m.MetricsComponent
          ),
      },

      // === ACCESIBILIDAD (TODO) ===
      {
        path: 'accessibility',
        canActivate: [modulePermissionGuard('ACCESSIBILITY', 'view')],
        loadComponent: () =>
          import('./pages/accessibility/accessibility.component').then(
            (m) => m.AccessibilityComponent
          ),
      },

      // === CLIENTES ===
      {
        path: 'customers',
        canActivate: [modulePermissionGuard('CUSTOMERS', 'view')],
        loadComponent: () =>
          import('./pages/customers/customers-list.component').then(
            (m) => m.CustomersListComponent
          ),
      },

      // === CONFIGURACIÓN GENERAL ===
      {
        path: 'settings',
        canActivate: [modulePermissionGuard('SETTINGS', 'view')],
        loadComponent: () =>
          import('./pages/settings/settings.component').then(
            (m) => m.SettingsComponent
          ),
      },

      // Página de acceso denegado
      {
        path: 'access-denied',
        loadComponent: () =>
          import('./pages/access-denied/access-denied.component').then(
            (m) => m.AccessDeniedComponent
          ),
      },
    ],
  },
];

/**
 * 💡 Notas de Implementación:
 *
 * 1. **Guards en Cascada:**
 *    - authGuard: Verifica que esté autenticado
 *    - tenantAdminGuard: Verifica que sea admin del tenant (no cliente)
 *    - modulePermissionGuard: Verifica permisos específicos del módulo
 *
 * 2. **Códigos de Módulo:**
 *    Deben coincidir EXACTAMENTE con los que envía el backend en
 *    el campo `moduleCode` de los permisos.
 *
 * 3. **Acciones de Permisos:**
 *    - 'view': Ver/listar recursos
 *    - 'create': Crear nuevos recursos
 *    - 'update': Editar recursos existentes
 *    - 'delete': Eliminar recursos
 *
 * 4. **Rutas Anidadas:**
 *    Usa children para rutas relacionadas. El guard del padre se aplica
 *    a todos los hijos automáticamente.
 *
 * 5. **Lazy Loading:**
 *    Todos los componentes se cargan de forma diferida (loadComponent)
 *    para optimizar el bundle inicial.
 */

/**
 * 🔄 Ejemplo de Uso en app.routes.ts:
 *
 * ```typescript
 * import { Routes } from '@angular/router';
 * import { TENANT_ADMIN_ROUTES } from './features/admin/admin.routes';
 *
 * export const routes: Routes = [
 *   // Rutas públicas
 *   { path: '', component: HomeComponent },
 *   { path: 'login', component: LoginComponent },
 *
 *   // Rutas administrativas
 *   ...TENANT_ADMIN_ROUTES,
 *
 *   // Rutas de cliente
 *   { path: 'my-account', component: MyAccountComponent, canActivate: [customerGuard] },
 *
 *   // Fallback
 *   { path: '**', redirectTo: '' }
 * ];
 * ```
 */
