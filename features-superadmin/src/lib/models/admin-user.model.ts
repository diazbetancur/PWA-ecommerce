/**
 * 👤 Modelos para Gestión de Usuarios Administrativos del Sistema
 *
 * Define DTOs para CRUD de usuarios admin (AdminUser),
 * asignación de roles, y gestión de permisos del panel SuperAdmin.
 */

/**
 * Roles predefinidos del sistema administrativo
 * (coinciden con AdminRoleNames en backend)
 */
export enum AdminRoleName {
  SuperAdmin = 'SuperAdmin',
  TenantManager = 'TenantManager',
  Support = 'Support',
  Viewer = 'Viewer',
}

/**
 * Etiquetas y descripciones de roles para UI
 */
export const AdminRoleLabels: Record<
  AdminRoleName,
  { label: string; description: string; color: string }
> = {
  [AdminRoleName.SuperAdmin]: {
    label: 'Super Administrador',
    description: 'Acceso total al sistema',
    color: 'red',
  },
  [AdminRoleName.TenantManager]: {
    label: 'Gestor de Comercios',
    description: 'Gestión de tenants y planes',
    color: 'blue',
  },
  [AdminRoleName.Support]: {
    label: 'Soporte Técnico',
    description: 'Consulta y soporte',
    color: 'orange',
  },
  [AdminRoleName.Viewer]: {
    label: 'Visualizador',
    description: 'Solo lectura',
    color: 'gray',
  },
};

/**
 * DTO de resumen de usuario administrativo (para listas)
 */
export interface AdminUserSummaryDto {
  /**
   * ID único del usuario
   */
  id: string;

  /**
   * Email del usuario (usado para login)
   */
  email: string;

  /**
   * Nombre completo del usuario
   */
  fullName: string;

  /**
   * Indica si el usuario está activo
   */
  isActive: boolean;

  /**
   * Roles asignados al usuario
   */
  roles: string[];

  /**
   * Fecha de creación
   */
  createdAt: string;

  /**
   * Fecha del último login
   */
  lastLoginAt?: string;
}

/**
 * DTO de detalle de usuario administrativo (para vista detallada)
 */
export interface AdminUserDetailDto {
  /**
   * ID único del usuario
   */
  id: string;

  /**
   * Email del usuario (usado para login)
   */
  email: string;

  /**
   * Nombre completo del usuario
   */
  fullName: string;

  /**
   * Indica si el usuario está activo
   */
  isActive: boolean;

  /**
   * Roles asignados al usuario (objetos completos)
   */
  roles: AdminRoleDto[];

  /**
   * Fecha de creación
   */
  createdAt: string;

  /**
   * Fecha de última actualización
   */
  updatedAt?: string;

  /**
   * Fecha del último login
   */
  lastLoginAt?: string;
}

/**
 * Request para crear un nuevo usuario administrativo
 */
export interface CreateAdminUserRequest {
  /**
   * Email del usuario (requerido, único)
   */
  email: string;

  /**
   * Nombre completo del usuario
   */
  fullName: string;

  /**
   * Contraseña temporal (min 8 caracteres, requerido)
   */
  password: string;

  /**
   * Roles a asignar (al menos uno)
   * NOTA: Backend espera "roleNames" no "roles"
   */
  roleNames: string[];
}

/**
 * Request para actualizar un usuario administrativo
 */
export interface UpdateAdminUserRequest {
  /**
   * Email del usuario (opcional)
   */
  email?: string;

  /**
   * Nombre completo del usuario (opcional)
   */
  fullName?: string;

  /**
   * Estado activo/inactivo (opcional)
   */
  isActive?: boolean;
}

/**
 * Request para actualizar roles de un usuario
 */
export interface UpdateAdminUserRolesRequest {
  /**
   * Nuevos roles del usuario (reemplaza los existentes)
   * NOTA: Backend espera "roleNames" no "roles"
   */
  roleNames: string[];
}

/**
 * Request para cambiar contraseña de un usuario
 */
export interface UpdatePasswordRequest {
  /**
   * Nueva contraseña (min 8 caracteres)
   */
  newPassword: string;

  /**
   * Forzar cambio de contraseña en el próximo login
   */
  forceChangeOnNextLogin?: boolean;
}

/**
 * Parámetros de consulta para listar usuarios administrativos
 */
export interface AdminUserQuery {
  /**
   * Número de página (1-based)
   */
  page?: number;

  /**
   * Tamaño de página
   */
  pageSize?: number;

  /**
   * Término de búsqueda (busca en email y fullName)
   */
  search?: string;

  /**
   * Filtrar por estado activo/inactivo
   */
  isActive?: boolean;

  /**
   * Filtrar por rol específico
   */
  role?: string;

  /**
   * Ordenar por campo
   */
  sortBy?: 'email' | 'fullName' | 'createdAt' | 'lastLoginAt';

  /**
   * Dirección de ordenamiento
   */
  sortDirection?: 'asc' | 'desc';
}

/**
 * Respuesta paginada de usuarios administrativos
 */
export interface PagedAdminUsersResponse {
  /**
   * Lista de usuarios en la página actual
   */
  items: AdminUserSummaryDto[];

  /**
   * Total de usuarios que coinciden con el filtro
   */
  totalCount: number;

  /**
   * Número de página actual (1-based)
   */
  page: number;

  /**
   * Tamaño de página
   */
  pageSize: number;

  /**
   * Total de páginas
   */
  totalPages: number;
}

/**
 * DTO básico de rol administrativo (para listas simples)
 */
export interface AdminRoleDto {
  /**
   * ID único del rol
   */
  id: string;

  /**
   * Nombre del rol
   */
  name: string;
}

/**
 * DTO completo de rol administrativo (con permisos y usuarios)
 */
export interface AdminRoleDetailDto {
  /**
   * ID único del rol
   */
  id: string;

  /**
   * Nombre del rol
   */
  name: string;

  /**
   * Descripción del rol
   */
  description?: string;

  /**
   * Indica si es un rol del sistema (no se puede eliminar)
   */
  isSystemRole?: boolean;

  /**
   * Cantidad de usuarios con este rol asignado
   */
  userCount?: number;

  /**
   * Permisos asignados al rol
   */
  permissions?: AdminPermissionDto[];

  /**
   * Fecha de creación
   */
  createdAt?: string;
}

/**
 * DTO de permiso administrativo
 */
export interface AdminPermissionDto {
  /**
   * ID único del permiso
   */
  id: string;

  /**
   * Nombre del permiso (ej: "Tenants:Create")
   */
  name: string;

  /**
   * Recurso al que aplica (ej: "Tenants")
   */
  resource: string;

  /**
   * Acción permitida (ej: "Create")
   */
  action: string;

  /**
   * Descripción del permiso
   */
  description?: string;
}

/**
 * Respuesta de permisos agrupados por recurso
 */
export interface PermissionsGroupedResponse {
  /**
   * Grupos de permisos organizados por recurso
   */
  groups: PermissionGroup[];
}

/**
 * Grupo de permisos por recurso
 */
export interface PermissionGroup {
  /**
   * Nombre del recurso (ej: "Tenants", "Users")
   */
  resource: string;

  /**
   * Permisos del recurso
   */
  permissions: AdminPermissionDto[];
}

/**
 * Request para crear un rol administrativo
 */
export interface CreateAdminRoleRequest {
  /**
   * Nombre del rol (único)
   */
  name: string;

  /**
   * Descripción del rol (opcional)
   */
  description?: string;

  /**
   * IDs de permisos a asignar
   */
  permissionIds: string[];
}

/**
 * Request para actualizar un rol administrativo
 */
export interface UpdateAdminRoleRequest {
  /**
   * Nuevo nombre del rol (opcional)
   * NOTA: Los roles del sistema no pueden cambiar de nombre
   */
  name?: string;

  /**
   * Nueva descripción (opcional)
   */
  description?: string;
}

/**
 * Request para actualizar permisos de un rol
 */
export interface UpdateRolePermissionsRequest {
  /**
   * IDs de permisos asignados (reemplaza todos los anteriores)
   */
  permissionIds: string[];
}

/**
 * Respuesta de permisos de un rol
 */
export interface RolePermissionsResponse {
  /**
   * ID del rol
   */
  roleId: string;

  /**
   * Nombre del rol
   */
  roleName: string;

  /**
   * Permisos asignados
   */
  permissions: AdminPermissionDto[];
}
