/**
 * 🔐 Servicio de Gestión de Roles Administrativos
 *
 * Maneja CRUD de roles administrativos del sistema y gestión de permisos.
 * Los roles controlan el acceso a funcionalidades del panel SuperAdmin.
 *
 * Endpoints base: /superadmin/admin-roles
 */

import { inject, Injectable } from '@angular/core';
import { ApiClientService } from '@pwa/core';
import { firstValueFrom } from 'rxjs';
import {
  AdminRoleDetailDto,
  CreateAdminRoleRequest,
  UpdateAdminRoleRequest,
  UpdateRolePermissionsRequest,
  RolePermissionsResponse,
  PermissionsGroupedResponse,
} from '../models/admin-user.model';

@Injectable({ providedIn: 'root' })
export class AdminRolesService {
  private readonly apiClient = inject(ApiClientService);

  /**
   * Obtener todos los roles administrativos con sus permisos
   *
   * @returns Lista completa de roles con permisos y conteo de usuarios
   *
   * @example
   * ```ts
   * const roles = await service.getAllRoles();
   * console.log('Roles:', roles.length);
   * ```
   */
  async getAllRoles(): Promise<AdminRoleDetailDto[]> {
    return firstValueFrom(
      this.apiClient.get<AdminRoleDetailDto[]>('/superadmin/admin-roles')
    );
  }

  /**
   * Obtener detalles de un rol específico
   *
   * @param roleId ID del rol
   * @returns Rol con permisos completos
   *
   * @throws 404 si el rol no existe
   */
  async getRoleById(roleId: string): Promise<AdminRoleDetailDto> {
    return firstValueFrom(
      this.apiClient.get<AdminRoleDetailDto>(
        `/superadmin/admin-roles/${roleId}`
      )
    );
  }

  /**
   * Crear un nuevo rol administrativo personalizado
   *
   * @param request Datos del rol (nombre, descripción, permisos)
   * @returns Rol creado
   *
   * @throws 400 si el nombre ya existe
   *
   * @example
   * ```ts
   * const newRole = await service.createRole({
   *   name: 'ReportViewer',
   *   description: 'Solo visualización de reportes',
   *   permissionIds: ['perm-1', 'perm-2']
   * });
   * ```
   */
  async createRole(
    request: CreateAdminRoleRequest
  ): Promise<AdminRoleDetailDto> {
    return firstValueFrom(
      this.apiClient.post<AdminRoleDetailDto>('/superadmin/admin-roles', request)
    );
  }

  /**
   * Actualizar información de un rol
   *
   * @param roleId ID del rol
   * @param request Datos a actualizar (nombre, descripción)
   * @returns Rol actualizado
   *
   * @throws 404 si el rol no existe
   * @throws 400 si intenta cambiar nombre de rol del sistema
   */
  async updateRole(
    roleId: string,
    request: UpdateAdminRoleRequest
  ): Promise<AdminRoleDetailDto> {
    return firstValueFrom(
      this.apiClient.put<AdminRoleDetailDto>(
        `/superadmin/admin-roles/${roleId}`,
        request
      )
    );
  }

  /**
   * Eliminar un rol administrativo
   *
   * @param roleId ID del rol
   * @returns true si se eliminó exitosamente
   *
   * @throws 404 si el rol no existe
   * @throws 400 si es rol del sistema o tiene usuarios asignados
   */
  async deleteRole(roleId: string): Promise<boolean> {
    await firstValueFrom(
      this.apiClient.delete<void>(`/superadmin/admin-roles/${roleId}`)
    );
    return true;
  }

  /**
   * Obtener todos los permisos disponibles agrupados por recurso
   *
   * @returns Permisos agrupados (Tenants, Users, Roles, etc.)
   *
   * @example
   * ```ts
   * const grouped = await service.getAllPermissions();
   * console.log('Recursos:', grouped.groups.map(g => g.resource));
   * ```
   */
  async getAllPermissions(): Promise<PermissionsGroupedResponse> {
    const endpoint = '/superadmin/permissions';
    console.log('🌐 [AdminRolesService] GET', endpoint);
    return firstValueFrom(
      this.apiClient.get<PermissionsGroupedResponse>(endpoint)
    );
  }

  /**
   * Obtener permisos asignados a un rol específico
   *
   * @param roleId ID del rol
   * @returns Permisos del rol
   */
  async getRolePermissions(roleId: string): Promise<RolePermissionsResponse> {
    const endpoint = `/superadmin/admin-roles/${roleId}/permissions`;
    console.log('🌐 [AdminRolesService] GET', endpoint);
    return firstValueFrom(
      this.apiClient.get<RolePermissionsResponse>(endpoint)
    );
  }

  /**
   * Actualizar permisos de un rol (reemplaza todos)
   *
   * @param roleId ID del rol
   * @param request IDs de permisos a asignar
   * @returns Permisos actualizados
   *
   * @throws 404 si el rol no existe
   * @throws 400 si algún permiso no existe
   */
  async updateRolePermissions(
    roleId: string,
    request: UpdateRolePermissionsRequest
  ): Promise<RolePermissionsResponse> {
    return firstValueFrom(
      this.apiClient.put<RolePermissionsResponse>(
        `/superadmin/admin-roles/${roleId}/permissions`,
        request
      )
    );
  }
}
