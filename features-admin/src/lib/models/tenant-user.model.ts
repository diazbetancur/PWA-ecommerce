/**
 * 👤 Tenant User Models
 *
 * DTOs y modelos para la gestión de usuarios del tenant (empleados/staff).
 * Estos son usuarios con roles administrativos dentro de un tenant específico.
 */

// ==================== USER SUMMARY ====================

/**
 * Resumen de usuario para listados
 */
export interface TenantUserSummaryDto {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  roles: string[];
  isActive: boolean;
  createdAt: string;
  lastLoginAt?: string;
}

/**
 * Respuesta al listar usuarios
 * GET /admin/users
 */
export interface TenantUsersResponse {
  users: TenantUserSummaryDto[];
  totalUsers: number;
  page?: number;
  pageSize?: number;
}

// ==================== USER DETAIL ====================

/**
 * Detalle completo de un usuario
 * GET /admin/users/{id}
 */
export interface TenantUserDetailDto {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  roles: string[];
  modules: string[];
  isActive: boolean;
  mustChangePassword: boolean;
  createdAt: string;
  lastLoginAt?: string;
  lastModifiedAt?: string;
}

// ==================== CREATE/UPDATE REQUESTS ====================

/**
 * Request para crear usuario
 * POST /admin/users
 */
export interface CreateTenantUserRequest {
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  password: string;
  roleIds: string[]; // IDs de los roles a asignar
  mustChangePassword?: boolean;
}

/**
 * Request para actualizar usuario
 * PUT /admin/users/{id}
 */
export interface UpdateTenantUserRequest {
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  isActive?: boolean;
}

/**
 * Request para actualizar roles de un usuario
 * PUT /admin/users/{id}/roles
 */
export interface UpdateUserRolesRequest {
  roleNames: string[];
}

/**
 * Request para resetear contraseña
 * POST /admin/users/{id}/reset-password
 */
export interface ResetPasswordRequest {
  newPassword: string;
  mustChangePassword?: boolean;
}

// ==================== UI HELPERS ====================

/**
 * Estado de carga para componentes de usuarios
 */
export interface UserLoadingState {
  isLoading: boolean;
  isError: boolean;
  errorMessage?: string;
}

/**
 * Filtros para listado de usuarios
 */
export interface UserListFilters {
  search?: string;
  roleId?: string;
  isActive?: boolean;
  page?: number;
  pageSize?: number;
}
