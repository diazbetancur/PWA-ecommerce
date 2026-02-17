/**
 * 🔐 RBAC Models (Role-Based Access Control)
 *
 * DTOs y modelos para el sistema de Roles y Permisos.
 * Contratos estrictos según los endpoints del backend.
 */

// ==================== USER SUMMARY ====================
export interface UserSummaryDto {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
}

// ==================== ROLES ====================

/**
 * Resumen de rol para listados
 */
export interface RoleSummaryDto {
  id: string;
  name: string;
  description?: string;
  isSystemRole: boolean;
  usersCount?: number;
  createdAt?: string;
}

/**
 * Respuesta al listar roles
 * GET /admin/roles
 */
export interface RolesResponse {
  roles: RoleSummaryDto[];
  totalRoles: number;
}

/**
 * Detalle completo de un rol
 * GET /admin/roles/{id}
 */
export interface RoleDetailDto {
  id: string;
  name: string;
  description: string;
  isSystemRole: boolean;
  users: UserSummaryDto[];
  permissions: ModulePermissionDto[];
  usersCount: number;
  createdAt: string;
  lastModifiedAt?: string;
}

/**
 * Request para crear rol
 * POST /admin/roles
 */
export interface CreateRoleRequest {
  name: string;
  description?: string;
}

/**
 * Request para actualizar rol
 * PUT /admin/roles/{id}
 */
export interface UpdateRoleRequest {
  name?: string;
  description?: string;
}

// ==================== MODULES & PERMISSIONS ====================

/**
 * Módulo disponible en el sistema
 */
export interface ModuleDto {
  code: string;
  name: string;
  description: string;
  icon: string;
  isActive: boolean;
  availablePermissions: string[]; // e.g., ["view", "create", "update", "delete"]
}

/**
 * Respuesta al obtener módulos disponibles
 * GET /admin/roles/available-modules
 */
export interface AvailableModulesResponse {
  modules: ModuleDto[];
}

/**
 * Permisos de un módulo específico
 */
export interface ModulePermissionDto {
  moduleCode: string;
  moduleName: string;
  canView: boolean;
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
}

/**
 * Respuesta al obtener permisos de un rol
 * GET /admin/roles/{id}/permissions
 */
export interface RolePermissionsResponse {
  roleId: string;
  roleName: string;
  permissions: ModulePermissionDto[];
}

/**
 * Request para actualizar permisos de un rol
 * PUT /admin/roles/{id}/permissions
 */
export interface UpdateRolePermissionsRequest {
  permissions: Array<{
    moduleCode: string;
    canView: boolean;
    canCreate: boolean;
    canUpdate: boolean;
    canDelete: boolean;
  }>;
}

// ==================== UI HELPERS ====================

/**
 * Estado de carga para componentes
 */
export interface RbacLoadingState {
  isLoading: boolean;
  isError: boolean;
  errorMessage?: string;
}

/**
 * Acción rápida para permisos
 */
export type PermissionAction = 'all' | 'readonly' | 'clear';

/**
 * Estado dirty para formulario de permisos
 */
export interface PermissionsDirtyState {
  isDirty: boolean;
  originalPermissions: ModulePermissionDto[];
  currentPermissions: ModulePermissionDto[];
}
