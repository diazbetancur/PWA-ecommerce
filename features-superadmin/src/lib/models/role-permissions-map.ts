/**
 * 🗺️ Mapeo de Roles Administrativos a Permisos
 *
 * Define qué permisos tiene cada rol del sistema administrativo.
 * Este mapeo se usa cuando el JWT no incluye permisos explícitos,
 * derivándolos automáticamente desde los roles del usuario.
 */

import { ADMIN_PERMISSIONS } from './admin-auth.model';
import { AdminRoleName } from './admin-user.model';

/**
 * Mapeo de roles del backend a conjuntos de permisos
 * 
 * Cada rol tiene asociado un array de permisos que representa
 * las acciones que puede realizar en el sistema.
 */
export const ROLE_TO_PERMISSIONS: Record<string, string[]> = {
  /**
   * 🔴 SuperAdmin: Acceso total al sistema
   * Puede realizar cualquier acción sin restricciones
   */
  [AdminRoleName.SuperAdmin]: [
    // Tenants - Control total
    ADMIN_PERMISSIONS.TENANTS.VIEW,
    ADMIN_PERMISSIONS.TENANTS.CREATE,
    ADMIN_PERMISSIONS.TENANTS.EDIT,
    ADMIN_PERMISSIONS.TENANTS.DELETE,
    ADMIN_PERMISSIONS.TENANTS.CONFIGURE,
    
    // Usuarios - Control total
    ADMIN_PERMISSIONS.USERS.VIEW,
    ADMIN_PERMISSIONS.USERS.CREATE,
    ADMIN_PERMISSIONS.USERS.EDIT,
    ADMIN_PERMISSIONS.USERS.DELETE,
    ADMIN_PERMISSIONS.USERS.MANAGE_ROLES,
    
    // Subscripciones - Control total
    ADMIN_PERMISSIONS.SUBSCRIPTIONS.VIEW,
    ADMIN_PERMISSIONS.SUBSCRIPTIONS.CREATE,
    ADMIN_PERMISSIONS.SUBSCRIPTIONS.EDIT,
    ADMIN_PERMISSIONS.SUBSCRIPTIONS.CANCEL,
    
    // Sistema - Control total
    ADMIN_PERMISSIONS.SYSTEM.VIEW_CONFIG,
    ADMIN_PERMISSIONS.SYSTEM.EDIT_CONFIG,
    ADMIN_PERMISSIONS.SYSTEM.VIEW_LOGS,
    ADMIN_PERMISSIONS.SYSTEM.MANAGE_FEATURES,
    
    // Analytics - Control total
    ADMIN_PERMISSIONS.ANALYTICS.VIEW,
    ADMIN_PERMISSIONS.ANALYTICS.EXPORT,
    
    // Billing - Control total
    ADMIN_PERMISSIONS.BILLING.VIEW,
    ADMIN_PERMISSIONS.BILLING.MANAGE,
  ],

  /**
   * 🔵 TenantManager: Gestión de comercios
   * Puede crear, editar y configurar tenants y sus planes
   */
  [AdminRoleName.TenantManager]: [
    // Tenants - CRUD completo
    ADMIN_PERMISSIONS.TENANTS.VIEW,
    ADMIN_PERMISSIONS.TENANTS.CREATE,
    ADMIN_PERMISSIONS.TENANTS.EDIT,
    ADMIN_PERMISSIONS.TENANTS.CONFIGURE,
    
    // Subscripciones - Gestión de planes
    ADMIN_PERMISSIONS.SUBSCRIPTIONS.VIEW,
    ADMIN_PERMISSIONS.SUBSCRIPTIONS.CREATE,
    ADMIN_PERMISSIONS.SUBSCRIPTIONS.EDIT,
    
    // Analytics - Solo visualización
    ADMIN_PERMISSIONS.ANALYTICS.VIEW,
    
    // Billing - Solo visualización
    ADMIN_PERMISSIONS.BILLING.VIEW,
  ],

  /**
   * 🟠 Support: Soporte técnico
   * Puede consultar información para dar soporte, sin capacidad de modificar
   */
  [AdminRoleName.Support]: [
    // Tenants - Solo lectura
    ADMIN_PERMISSIONS.TENANTS.VIEW,
    
    // Usuarios - Solo lectura
    ADMIN_PERMISSIONS.USERS.VIEW,
    
    // Subscripciones - Solo lectura
    ADMIN_PERMISSIONS.SUBSCRIPTIONS.VIEW,
    
    // Sistema - Solo logs
    ADMIN_PERMISSIONS.SYSTEM.VIEW_LOGS,
    
    // Analytics - Solo visualización
    ADMIN_PERMISSIONS.ANALYTICS.VIEW,
    
    // Billing - Solo visualización
    ADMIN_PERMISSIONS.BILLING.VIEW,
  ],

  /**
   * ⚪ Viewer: Visualizador
   * Solo puede ver información básica, sin acceso a configuraciones
   */
  [AdminRoleName.Viewer]: [
    // Tenants - Solo lectura
    ADMIN_PERMISSIONS.TENANTS.VIEW,
    
    // Usuarios - Solo lectura
    ADMIN_PERMISSIONS.USERS.VIEW,
    
    // Subscripciones - Solo lectura
    ADMIN_PERMISSIONS.SUBSCRIPTIONS.VIEW,
    
    // Analytics - Solo visualización
    ADMIN_PERMISSIONS.ANALYTICS.VIEW,
  ],
};

/**
 * Deriva permisos desde los roles del usuario
 * 
 * @param roles - Array de roles del usuario (desde JWT)
 * @returns Array con todos los permisos derivados de los roles
 * 
 * @example
 * ```typescript
 * const permissions = derivePermissionsFromRoles(['SuperAdmin']);
 * // Retorna todos los permisos del sistema
 * 
 * const permissions2 = derivePermissionsFromRoles(['Support', 'Viewer']);
 * // Retorna la unión de permisos de ambos roles
 * ```
 */
export function derivePermissionsFromRoles(roles: string[]): string[] {
  if (!roles || roles.length === 0) {
    return [];
  }

  // SuperAdmin tiene acceso completo (wildcard: todos los permisos)
  if (roles.some(role => 
    role.toLowerCase().replace('_', '') === 'superadmin'
  )) {
    return ['*'];
  }

  // Acumular permisos de todos los roles
  const allPermissions = new Set<string>();
  
  for (const role of roles) {
    const permissions = ROLE_TO_PERMISSIONS[role];
    if (permissions) {
      permissions.forEach(permission => allPermissions.add(permission));
    }
  }

  return Array.from(allPermissions);
}

/**
 * Verifica si un rol tiene un permiso específico
 * 
 * @param role - Nombre del rol
 * @param permission - Permiso a verificar
 * @returns true si el rol tiene ese permiso
 */
export function roleHasPermission(role: string, permission: string): boolean {
  const permissions = ROLE_TO_PERMISSIONS[role];
  return permissions ? permissions.includes(permission) : false;
}

/**
 * Obtiene todos los permisos de un rol específico
 * 
 * @param role - Nombre del rol
 * @returns Array de permisos del rol, o array vacío si el rol no existe
 */
export function getPermissionsForRole(role: string): string[] {
  return ROLE_TO_PERMISSIONS[role] || [];
}
