/**
 * 🔐 Guard de Permisos de Módulo
 *
 * Verifica que el usuario tenga el permiso necesario para acceder a una ruta
 * basado en los permisos de módulo (ModulePermission) del backend.
 *
 * Uso:
 * ```typescript
 * {
 *   path: 'products',
 *   component: ProductsComponent,
 *   canActivate: [modulePermissionGuard('PRODUCTS', 'view')]
 * }
 * ```
 */

import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { TenantAdminMenuService } from '../../services/tenant-admin-menu.service';
import { AuthService } from '../auth.service';

/**
 * Guard que verifica permisos de módulo
 *
 * @param moduleCode - Código del módulo (ej: 'catalog', 'orders', 'customers')
 * @returns CanActivateFn
 */
export function modulePermissionGuard(moduleCode: string): CanActivateFn {
  return () => {
    const authService = inject(AuthService);
    const menuService = inject(TenantAdminMenuService);
    const router = inject(Router);

    if (!authService.isAuthenticated()) {
      router.navigate(['/login']);
      return false;
    }

    if (!menuService.isTenantAdmin()) {
      console.warn(
        '[ModulePermissionGuard] Usuario no es administrador del tenant'
      );
      router.navigate(['/']);
      return false;
    }

    // Verificar si el usuario tiene acceso al módulo
    const hasPermission = menuService.canPerformAction(moduleCode);

    if (!hasPermission) {
      console.warn(
        `[ModulePermissionGuard] Sin permiso para módulo: ${moduleCode}`,
        {
          moduleCode,
          userModules: authService.claims?.modules,
        }
      );
      router.navigate(['/tenant-admin']);
      return false;
    }

    return true;
  };
}

/**
 * Guard que verifica si el usuario es un cliente (no admin)
 *
 * Uso:
 * ```typescript
 * {
 *   path: 'my-orders',
 *   component: CustomerOrdersComponent,
 *   canActivate: [customerGuard]
 * }
 * ```
 */
export const customerGuard: CanActivateFn = () => {
  const menuService = inject(TenantAdminMenuService);
  const router = inject(Router);

  if (!menuService.isCustomer()) {
    console.warn('[CustomerGuard] Usuario no es cliente');
    router.navigate(['/admin']);
    return false;
  }

  return true;
};

/**
 * Guard que verifica si el usuario es administrador del tenant
 *
 * Uso:
 * ```typescript
 * {
 *   path: 'admin',
 *   canActivate: [tenantAdminGuard],
 *   children: [...]
 * }
 * ```
 */
export const tenantAdminGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const menuService = inject(TenantAdminMenuService);
  const router = inject(Router);

  if (!authService.isAuthenticated()) {
    console.warn('[TenantAdminGuard] Usuario no autenticado');
    router.navigate(['/login']);
    return false;
  }

  if (!menuService.isTenantAdmin()) {
    console.warn('[TenantAdminGuard] Usuario no es administrador del tenant');
    router.navigate(['/']);
    return false;
  }

  return true;
};
