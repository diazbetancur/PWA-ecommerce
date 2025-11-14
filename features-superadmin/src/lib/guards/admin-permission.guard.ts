/**
 * 🔒 Guard de Permisos para el Módulo Administrativo
 *
 * Protege las rutas del superadmin verificando:
 * 1. Que el usuario esté autenticado
 * 2. Que tenga los permisos requeridos (declarados en route.data)
 * 3. Que el contexto sea el tenant general
 *
 * Uso:
 * ```typescript
 * {
 *   path: 'tenants/create',
 *   component: CreateTenantComponent,
 *   canActivate: [adminPermissionGuard],
 *   data: {
 *     requiredPermissions: ['tenants:create'],
 *     requiredRoles: ['TENANT_ADMIN', 'SUPER_ADMIN'], // Opcional
 *     permissionMode: 'all' // 'all' (AND) o 'any' (OR)
 *   }
 * }
 * ```
 */

import { inject } from '@angular/core';
import { CanActivateFn, Router, ActivatedRouteSnapshot } from '@angular/router';
import { AuthService, TenantContextService } from '@pwa/core';

/**
 * Datos que se pueden configurar en route.data para el guard
 */
export interface AdminPermissionGuardData {
  /**
   * Lista de permisos requeridos
   */
  requiredPermissions?: string[];

  /**
   * Lista de roles requeridos (alternativa o complemento a permisos)
   */
  requiredRoles?: string[];

  /**
   * Modo de verificación de permisos:
   * - 'all': El usuario debe tener TODOS los permisos (AND)
   * - 'any': El usuario debe tener AL MENOS UNO de los permisos (OR)
   * Por defecto: 'all'
   */
  permissionMode?: 'all' | 'any';

  /**
   * URL a la que redirigir si no tiene permisos
   * Por defecto: '/admin/access-denied'
   */
  redirectTo?: string;
}

/**
 * Helper para verificar si el usuario tiene el acceso requerido
 */
function hasRequiredAccess(
  claims: { role?: string; permissions?: string[] },
  requiredRoles: string[],
  requiredPermissions: string[],
  mode: 'all' | 'any' = 'all'
): boolean {
  // Verificar roles (lógica OR: al menos uno)
  if (requiredRoles.length > 0 && requiredRoles.includes(claims.role || '')) {
    return true;
  }

  // Verificar permisos
  if (requiredPermissions.length > 0) {
    const userPermissions = claims.permissions || [];

    // Permiso wildcard para super admin
    if (userPermissions.includes('*')) {
      return true;
    }

    if (mode === 'all') {
      return requiredPermissions.every((permission) =>
        userPermissions.includes(permission)
      );
    } else {
      return requiredPermissions.some((permission) =>
        userPermissions.includes(permission)
      );
    }
  }

  return false;
}

/**
 * 🛡️ Guard principal para rutas del admin
 */
export const adminPermissionGuard: CanActivateFn = (
  route: ActivatedRouteSnapshot
) => {
  const authService = inject(AuthService);
  const tenantContext = inject(TenantContextService);
  const router = inject(Router);

  const data = route.data as AdminPermissionGuardData;
  const redirectTo = data.redirectTo || '/admin/access-denied';

  // 1. Verificar que esté autenticado
  if (!authService.isAuthenticated()) {
    console.warn('[AdminPermissionGuard] Usuario no autenticado');
    router.navigate(['/login'], {
      queryParams: { returnUrl: route.url.join('/') },
    });
    return false;
  }

  // 2. Verificar que estamos en contexto de tenant general
  // (El tenantSlug debería ser null o 'general-admin' cuando es superadmin)
  const tenantSlug = tenantContext.getTenantSlug();
  const isGeneralContext =
    tenantSlug === null || tenantSlug === 'general-admin';

  if (!isGeneralContext) {
    console.warn(
      '[AdminPermissionGuard] Intento de acceso al admin desde un tenant específico',
      { tenantSlug }
    );
    router.navigateByUrl(redirectTo);
    return false;
  }

  const claims = authService.claims;

  if (!claims) {
    console.warn('[AdminPermissionGuard] No hay claims en el token');
    router.navigate(['/login']);
    return false;
  }

  // 3. Verificar permisos
  const requiredPermissions = data.requiredPermissions || [];
  const requiredRoles = data.requiredRoles || [];

  // Si no hay requisitos, permitir acceso
  if (requiredPermissions.length === 0 && requiredRoles.length === 0) {
    return true;
  }

  // Verificar si tiene acceso basado en roles o permisos
  if (
    hasRequiredAccess(
      claims,
      requiredRoles,
      requiredPermissions,
      data.permissionMode
    )
  ) {
    return true;
  }

  // No tiene los permisos necesarios
  console.warn('[AdminPermissionGuard] Acceso denegado', {
    requiredPermissions,
    requiredRoles,
    userRole: claims.role,
    userPermissions: claims.permissions,
  });

  router.navigateByUrl(redirectTo);
  return false;
};

/**
 * 🔐 Guard auxiliar: solo verifica autenticación y contexto de admin
 * (sin verificar permisos específicos)
 */
export const adminAuthGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const tenantContext = inject(TenantContextService);
  const router = inject(Router);

  if (!authService.isAuthenticated()) {
    router.navigate(['/login']);
    return false;
  }

  const tenantSlug = tenantContext.getTenantSlug();
  const isGeneralContext =
    tenantSlug === null || tenantSlug === 'general-admin';

  if (!isGeneralContext) {
    router.navigate(['/']);
    return false;
  }

  return true;
};

/**
 * 🛡️ Helper para crear guards con permisos inline
 *
 * Uso:
 * ```typescript
 * {
 *   path: 'tenants/create',
 *   canActivate: [withPermissions(['tenants:create'])],
 *   component: CreateTenantComponent
 * }
 * ```
 */
export function withPermissions(
  permissions: string[],
  mode: 'all' | 'any' = 'all'
): CanActivateFn {
  return (route: ActivatedRouteSnapshot, state) => {
    // Inyectamos los permisos en route.data temporalmente
    route.data = {
      ...route.data,
      requiredPermissions: permissions,
      permissionMode: mode,
    };
    return adminPermissionGuard(route, state);
  };
}

/**
 * 🎭 Helper para crear guards con roles inline
 */
export function withRoles(roles: string[]): CanActivateFn {
  return (route: ActivatedRouteSnapshot, state) => {
    route.data = {
      ...route.data,
      requiredRoles: roles,
    };
    return adminPermissionGuard(route, state);
  };
}
