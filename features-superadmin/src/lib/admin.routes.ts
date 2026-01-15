/**
 * 🛣️ Rutas del Módulo Administrativo General
 *
 * Define todas las rutas del superadmin con:
 * - Lazy loading de componentes
 * - Guards de autenticación y permisos
 * - Metadata declarativa (requiredPermissions)
 */

import { Routes } from '@angular/router';
import {
  adminAuthGuard,
  adminPermissionGuard,
} from './guards/admin-permission.guard';
import { ADMIN_PERMISSIONS } from './models/admin-auth.model';
import {
  AdminProfileComponent,
  AdminSettingsComponent,
  AnalyticsDashboardComponent,
  BillingOverviewComponent,
  FeatureFlagsComponent,
  SubscriptionListComponent,
  SystemConfigComponent,
  SystemLogsComponent,
  TenantConfigComponent,
  TenantDetailComponent,
  TenantEditComponent,
  UserListComponent,
  UserRolesComponent,
} from './pages/placeholder.components';

export const ADMIN_ROUTES: Routes = [
  // Ruta de login SIN guard de autenticación
  // Usa componente específico con endpoint admin/auth/login
  {
    path: 'login',
    loadComponent: () =>
      import('@pwa/features-account').then((m) => m.LoginComponent),
  },
  // Rutas protegidas con guard de autenticación
  {
    path: '',
    loadComponent: () =>
      import('./components/admin-shell/admin-shell.component').then(
        (m) => m.AdminShellComponent
      ),
    canActivate: [adminAuthGuard],
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full',
      },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./components/admin-dashboard/admin-dashboard.component').then(
            (m) => m.AdminDashboardComponent
          ),
        data: {
          title: 'Dashboard',
        },
      },
      // --- GESTIÓN DE TENANTS ---
      {
        path: 'tenants',
        canActivate: [adminPermissionGuard],
        data: {
          requiredPermissions: [ADMIN_PERMISSIONS.TENANTS.VIEW],
        },
        children: [
          {
            path: '',
            loadComponent: () =>
              import('./pages/tenants-list/tenants-list.component').then(
                (m) => m.TenantsListComponent
              ),
            data: {
              title: 'Lista de Comercios',
            },
          },
          {
            path: 'create',
            loadComponent: () =>
              import('./pages/tenant-create/tenant-create.component').then(
                (m) => m.TenantCreateComponent
              ),
            canActivate: [adminPermissionGuard],
            data: {
              title: 'Crear Comercio',
              requiredPermissions: [ADMIN_PERMISSIONS.TENANTS.CREATE],
            },
          },
          {
            path: ':id',
            component: TenantDetailComponent,
            data: {
              title: 'Detalle del Comercio',
            },
          },
          {
            path: ':id/edit',
            component: TenantEditComponent,
            canActivate: [adminPermissionGuard],
            data: {
              title: 'Editar Comercio',
              requiredPermissions: [ADMIN_PERMISSIONS.TENANTS.EDIT],
            },
          },
          {
            path: 'config',
            component: TenantConfigComponent,
            canActivate: [adminPermissionGuard],
            data: {
              title: 'Configuración de Comercios',
              requiredPermissions: [ADMIN_PERMISSIONS.TENANTS.CONFIGURE],
            },
          },
        ],
      },
      // --- GESTIÓN DE USUARIOS ---
      {
        path: 'users',
        canActivate: [adminPermissionGuard],
        data: {
          requiredPermissions: [ADMIN_PERMISSIONS.USERS.VIEW],
        },
        children: [
          {
            path: '',
            component: UserListComponent,
            data: {
              title: 'Lista de Usuarios',
            },
          },
          {
            path: 'roles',
            component: UserRolesComponent,
            canActivate: [adminPermissionGuard],
            data: {
              title: 'Roles y Permisos',
              requiredPermissions: [ADMIN_PERMISSIONS.USERS.MANAGE_ROLES],
            },
          },
        ],
      },
      // --- SUBSCRIPCIONES ---
      {
        path: 'subscriptions',
        component: SubscriptionListComponent,
        canActivate: [adminPermissionGuard],
        data: {
          title: 'Subscripciones',
          requiredPermissions: [ADMIN_PERMISSIONS.SUBSCRIPTIONS.VIEW],
        },
      },
      // --- FACTURACIÓN ---
      {
        path: 'billing',
        component: BillingOverviewComponent,
        canActivate: [adminPermissionGuard],
        data: {
          title: 'Facturación',
          requiredPermissions: [ADMIN_PERMISSIONS.BILLING.VIEW],
        },
      },
      // --- ANALYTICS ---
      {
        path: 'analytics',
        component: AnalyticsDashboardComponent,
        canActivate: [adminPermissionGuard],
        data: {
          title: 'Analytics',
          requiredPermissions: [ADMIN_PERMISSIONS.ANALYTICS.VIEW],
        },
      },
      // --- SISTEMA ---
      {
        path: 'system',
        canActivate: [adminPermissionGuard],
        data: {
          requiredPermissions: [ADMIN_PERMISSIONS.SYSTEM.VIEW_CONFIG],
          permissionMode: 'any', // Al menos uno de los permisos de sistema
        },
        children: [
          {
            path: 'config',
            component: SystemConfigComponent,
            canActivate: [adminPermissionGuard],
            data: {
              title: 'Configuración Global',
              requiredPermissions: [ADMIN_PERMISSIONS.SYSTEM.VIEW_CONFIG],
            },
          },
          {
            path: 'features',
            component: FeatureFlagsComponent,
            canActivate: [adminPermissionGuard],
            data: {
              title: 'Feature Flags',
              requiredPermissions: [ADMIN_PERMISSIONS.SYSTEM.MANAGE_FEATURES],
            },
          },
          {
            path: 'logs',
            component: SystemLogsComponent,
            canActivate: [adminPermissionGuard],
            data: {
              title: 'Logs del Sistema',
              requiredPermissions: [ADMIN_PERMISSIONS.SYSTEM.VIEW_LOGS],
            },
          },
        ],
      },
      // --- ACCESO DENEGADO ---
      {
        path: 'access-denied',
        loadComponent: () =>
          import('./components/access-denied/access-denied.component').then(
            (m) => m.AccessDeniedComponent
          ),
        data: {
          title: 'Acceso Denegado',
        },
      },
      // --- PERFIL DEL ADMINISTRADOR ---
      {
        path: 'profile',
        component: AdminProfileComponent,
        data: {
          title: 'Mi Perfil',
        },
      },
      {
        path: 'settings',
        component: AdminSettingsComponent,
        data: {
          title: 'Configuración',
        },
      },
    ],
  },
];
