/**
 * 👤 Servicio de Gestión de Usuarios Administrativos
 *
 * Maneja todas las operaciones CRUD de usuarios del sistema administrativo,
 * asignación de roles, cambio de contraseñas y estadísticas.
 *
 * Endpoints base: /superadmin/users
 */

import { inject, Injectable } from '@angular/core';
import { ApiClientService } from '@pwa/core';
import { firstValueFrom } from 'rxjs';
import {
  AdminUserDetailDto,
  AdminUserQuery,
  CreateAdminUserRequest,
  PagedAdminUsersResponse,
  UpdateAdminUserRequest,
  UpdateAdminUserRolesRequest,
  UpdatePasswordRequest,
  AdminRoleDto,
} from '../models/admin-user.model';

@Injectable({ providedIn: 'root' })
export class AdminUserManagementService {
  private readonly apiClient = inject(ApiClientService);

  /**
   * Obtener lista paginada de usuarios administrativos
   *
   * @param query Parámetros de consulta (paginación, filtros, ordenamiento)
   * @returns Lista paginada de usuarios
   *
   * @example
   * ```ts
   * const users = await service.getUsers({
   *   page: 1,
   *   pageSize: 20,
   *   search: 'admin',
   *   isActive: true,
   *   role: 'SuperAdmin'
   * });
   * ```
   */
  async getUsers(query?: AdminUserQuery): Promise<PagedAdminUsersResponse> {
    const params: Record<string, string | number | boolean> = {
      page: query?.page || 1,
      pageSize: query?.pageSize || 20,
    };

    if (query?.search) params['search'] = query.search;
    if (query?.isActive !== undefined) params['isActive'] = query.isActive;
    if (query?.role) params['role'] = query.role;
    if (query?.sortBy) params['sortBy'] = query.sortBy;
    if (query?.sortDirection) params['sortDirection'] = query.sortDirection;

    return firstValueFrom(
      this.apiClient.get<PagedAdminUsersResponse>('/superadmin/users', { params })
    );
  }

  /**
   * Obtener detalle de un usuario administrativo por ID
   *
   * @param userId ID del usuario
   * @returns Detalle completo del usuario
   *
   * @throws 404 si el usuario no existe
   */
  async getUserById(userId: string): Promise<AdminUserDetailDto> {
    return firstValueFrom(
      this.apiClient.get<AdminUserDetailDto>(`/superadmin/users/${userId}`)
    );
  }

  /**
   * Crear un nuevo usuario administrativo
   *
   * @param request Datos del usuario a crear
   * @returns Usuario creado
   *
   * @throws 400 si el email ya existe o datos inválidos
   *
   * @example
   * ```ts
   * const newUser = await service.createUser({
   *   email: 'nuevo.admin@example.com',
   *   fullName: 'Nuevo Administrador',
   *   password: 'TempPass123!',
   *   roleNames: ['TenantManager']
   * });
   * ```
   */
  async createUser(
    request: CreateAdminUserRequest
  ): Promise<AdminUserDetailDto> {
    return firstValueFrom(
      this.apiClient.post<AdminUserDetailDto>('/superadmin/users', request)
    );
  }

  /**
   * Actualizar información de un usuario administrativo
   *
   * @param userId ID del usuario
   * @param request Datos a actualizar (campos opcionales)
   * @returns Usuario actualizado
   *
   * @throws 404 si el usuario no existe
   * @throws 400 si el email ya está en uso por otro usuario
   */
  async updateUser(
    userId: string,
    request: UpdateAdminUserRequest
  ): Promise<AdminUserDetailDto> {
    return firstValueFrom(
      this.apiClient.put<AdminUserDetailDto>(`/superadmin/users/${userId}`, request)
    );
  }

  /**
   * Actualizar roles de un usuario administrativo
   *
   * @param userId ID del usuario
   * @param request Nuevos roles (reemplaza los existentes)
   * @returns Usuario actualizado
   *
   * @throws 404 si el usuario no existe
   * @throws 400 si los roles son inválidos
   *
   * @example
   * ```ts
   * await service.updateUserRoles(userId, {
   *   roleNames: ['SuperAdmin', 'TenantManager']
   * });
   * ```
   */
  async updateUserRoles(
    userId: string,
    request: UpdateAdminUserRolesRequest
  ): Promise<AdminUserDetailDto> {
    return firstValueFrom(
      this.apiClient.put<AdminUserDetailDto>(
        `/superadmin/users/${userId}/roles`,
        request
      )
    );
  }

  /**
   * Cambiar contraseña de un usuario administrativo
   *
   * @param userId ID del usuario
   * @param request Nueva contraseña y opciones
   * @returns true si se cambió exitosamente
   *
   * @throws 404 si el usuario no existe
   * @throws 400 si la contraseña no cumple requisitos
   *
   * @example
   * ```ts
   * await service.updatePassword(userId, {
   *   newPassword: 'NewSecurePass123!',
   *   forceChangeOnNextLogin: true
   * });
   * ```
   */
  async updatePassword(
    userId: string,
    request: UpdatePasswordRequest
  ): Promise<boolean> {
    await firstValueFrom(
      this.apiClient.patch<void>(`/superadmin/users/${userId}/password`, request)
    );
    return true;
  }

  /**
   * Eliminar un usuario administrativo (soft delete)
   *
   * @param userId ID del usuario
   * @returns true si se eliminó exitosamente
   *
   * @throws 404 si el usuario no existe
   * @throws 400 si no se puede eliminar (ej: último SuperAdmin)
   *
   * ⚠️ NOTA: Esta operación puede estar restringida según políticas del sistema
   */
  async deleteUser(userId: string): Promise<boolean> {
    await firstValueFrom(
      this.apiClient.delete<void>(`/superadmin/users/${userId}`)
    );
    return true;
  }

  /**
   * Obtener todos los roles disponibles del sistema
   *
   * @returns Lista de roles (SuperAdmin, TenantManager, Support, Viewer)
   *
   * @example
   * ```ts
   * const roles = await service.getAllRoles();
   * console.log('Roles:', roles.map(r => r.name));
   * ```
   */
  async getAllRoles(): Promise<AdminRoleDto[]> {
    return firstValueFrom(
      this.apiClient.get<AdminRoleDto[]>('/superadmin/admin-roles')
    );
  }
}
