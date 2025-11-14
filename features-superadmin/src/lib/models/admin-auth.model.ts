/**
 * 🔐 Modelos de Permisos y Autorización para el Módulo Admin
 *
 * Define la estructura de permisos, roles y claims extraídos del JWT
 * del administrador general (superadmin).
 */

/**
 * Estructura del JWT del administrador general
 * Este token NO incluye tenant, ya que el superadmin gestiona todos los tenants
 */
export interface SuperAdminJwtPayload {
  /**
   * ID del usuario administrador
   */
  sub: string;

  /**
   * Email del administrador
   */
  email: string;

  /**
   * Nombre completo del administrador
   */
  name?: string;

  /**
   * Roles del administrador (ej: ['SUPER_ADMIN', 'TENANT_MANAGER'])
   */
  roles: string[];

  /**
   * Lista de permisos granulares
   * Formato: 'resource:action' (ej: 'tenants:create', 'users:read')
   */
  permissions: string[];

  /**
   * Timestamp de expiración (Unix timestamp)
   */
  exp: number;

  /**
   * Timestamp de emisión (Unix timestamp)
   */
  iat: number;

  /**
   * Issuer (quien emitió el token)
   */
  iss?: string;

  /**
   * Audience (para quién es el token)
   */
  aud?: string;

  /**
   * Flag que indica si es un token de superadmin
   */
  isSuperAdmin: boolean;
}

/**
 * Permisos del sistema agrupados por recurso
 */
export const ADMIN_PERMISSIONS = {
  // Gestión de Tenants
  TENANTS: {
    VIEW: 'tenants:view',
    CREATE: 'tenants:create',
    EDIT: 'tenants:edit',
    DELETE: 'tenants:delete',
    CONFIGURE: 'tenants:configure',
  },
  // Gestión de Usuarios (de todos los tenants)
  USERS: {
    VIEW: 'users:view',
    CREATE: 'users:create',
    EDIT: 'users:edit',
    DELETE: 'users:delete',
    MANAGE_ROLES: 'users:manage-roles',
  },
  // Gestión de Planes y Subscripciones
  SUBSCRIPTIONS: {
    VIEW: 'subscriptions:view',
    CREATE: 'subscriptions:create',
    EDIT: 'subscriptions:edit',
    CANCEL: 'subscriptions:cancel',
  },
  // Configuración Global del Sistema
  SYSTEM: {
    VIEW_CONFIG: 'system:view-config',
    EDIT_CONFIG: 'system:edit-config',
    VIEW_LOGS: 'system:view-logs',
    MANAGE_FEATURES: 'system:manage-features',
  },
  // Reportes y Analytics
  ANALYTICS: {
    VIEW: 'analytics:view',
    EXPORT: 'analytics:export',
  },
  // Billing y Facturación
  BILLING: {
    VIEW: 'billing:view',
    MANAGE: 'billing:manage',
  },
} as const;

/**
 * Roles predefinidos del sistema
 */
export const ADMIN_ROLES = {
  /**
   * Super administrador con todos los permisos
   */
  SUPER_ADMIN: 'SUPER_ADMIN',

  /**
   * Administrador de tenants (puede crear/editar tenants)
   */
  TENANT_ADMIN: 'TENANT_ADMIN',

  /**
   * Solo lectura de tenants
   */
  TENANT_VIEWER: 'TENANT_VIEWER',

  /**
   * Administrador de usuarios globales
   */
  USER_ADMIN: 'USER_ADMIN',

  /**
   * Administrador de facturación
   */
  BILLING_ADMIN: 'BILLING_ADMIN',

  /**
   * Analista (solo lectura de reportes)
   */
  ANALYST: 'ANALYST',
} as const;

/**
 * Resultado de la verificación de permisos
 */
export interface PermissionCheckResult {
  granted: boolean;
  reason?: string;
  missingPermissions?: string[];
  missingRoles?: string[];
}

/**
 * Configuración de contexto del administrador general
 */
export interface SuperAdminContext {
  /**
   * Usuario autenticado
   */
  user: {
    id: string;
    email: string;
    name: string;
  };

  /**
   * Roles activos
   */
  roles: string[];

  /**
   * Permisos activos
   */
  permissions: string[];

  /**
   * Flag de superadmin
   */
  isSuperAdmin: boolean;

  /**
   * Token JWT (para debugging)
   */
  token?: string;
}
