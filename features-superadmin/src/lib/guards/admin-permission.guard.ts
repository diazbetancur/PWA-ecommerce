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
import { ActivatedRouteSnapshot, CanActivateFn, Router } from '@angular/router';
import { AuthService, TenantContextService } from '@pwa/core';
import { derivePermissionsFromRoles } from '../models/role-permissions-map';

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
 * Normaliza el rol que puede venir como string o array desde .NET
 */
function normalizeRole(role: string | string[] | undefined): string | null {
  if (!role) return null;

  // Si es array, tomar el primer elemento
  const roleStr = Array.isArray(role) ? role[0] : role;

  // Normalizar: quitar guiones bajos y convertir a minúsculas
  return roleStr?.toLowerCase().replaceAll('_', '') || null;
}

/**
 * Extrae y normaliza los roles del usuario desde los claims
 */
function extractUserRoles(claims: { role?: string | string[]; roles?: string[] }): string[] {
  // Priorizar claims.roles si existe
  if (claims.roles && claims.roles.length > 0) {
    return claims.roles;
  }
  
  // Fallback a claims.role (legacy)
  if (!claims.role) {
    return [];
  }
  
  return Array.isArray(claims.role) ? claims.role : [claims.role];
}

/**
 * Verifica si es SuperAdmin
 */
function isSuperAdmin(claims: { role?: string | string[]; roles?: string[] }): boolean {
  const normalizedRole = normalizeRole(claims.role);
  if (normalizedRole === 'superadmin') {
    return true;
  }

  const userRoles = extractUserRoles(claims);
  return userRoles.some(role => 
    role.toLowerCase().replace('_', '') === 'superadmin'
  );
}

/**
 * Verifica si el usuario tiene alguno de los roles requeridos
 */
function hasAnyRequiredRole(userRoles: string[], requiredRoles: string[]): boolean {
  if (requiredRoles.length === 0) {
    return false;
  }

  const normalizedRequired = requiredRoles.map((r) =>
    r.toLowerCase().replaceAll('_', '')
  );
  
  return userRoles.some(userRole => {
    const normalizedUserRole = userRole.toLowerCase().replaceAll('_', '');
    return normalizedRequired.includes(normalizedUserRole);
  });
}

/**
 * Obtiene los permisos del usuario (explícitos o derivados de roles)
 */
function getUserPermissions(
  claims: { permissions?: any; roles?: string[]; role?: string | string[] }
): string[] {
  // Intentar obtener permisos explícitos del JWT
  const explicitPermissions = Array.isArray(claims.permissions)
    ? claims.permissions.map((p: any) =>
        typeof p === 'string' ? p : p.moduleCode
      )
    : [];

  if (explicitPermissions.length > 0) {
    return explicitPermissions;
  }

  // Si no hay permisos explícitos, derivarlos de los roles
  const userRoles = extractUserRoles(claims);
  if (userRoles.length > 0) {
    return derivePermissionsFromRoles(userRoles);
  }

  return [];
}

/**
 * Verifica si el usuario tiene los permisos requeridos
 */
function hasRequiredPermissions(
  userPermissions: string[],
  requiredPermissions: string[],
  mode: 'all' | 'any' = 'all'
): boolean {
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

/**
 * Helper para verificar si el usuario tiene el acceso requerido
 */
function hasRequiredAccess(
  claims: { role?: string | string[]; roles?: string[]; permissions?: any },
  requiredRoles: string[],
  requiredPermissions: string[],
  mode: 'all' | 'any' = 'all'
): boolean {
  // SuperAdmin tiene acceso total
  if (isSuperAdmin(claims)) {
    return true;
  }

  // Verificar roles (lógica OR: al menos uno)
  const userRoles = extractUserRoles(claims);
  if (hasAnyRequiredRole(userRoles, requiredRoles)) {
    return true;
  }

  // Verificar permisos
  if (requiredPermissions.length > 0) {
    const userPermissions = getUserPermissions(claims);
    return hasRequiredPermissions(userPermissions, requiredPermissions, mode);
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
    router.navigate(['/admin/login'], {
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
    router.navigateByUrl(redirectTo);
    return false;
  }

  const claims = authService.claims;

  if (!claims) {
    router.navigate(['/admin/login']);
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
    router.navigate(['/admin/login']);
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
