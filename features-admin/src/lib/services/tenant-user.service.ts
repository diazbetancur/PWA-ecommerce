/**
 * 👤 Tenant User Service
 *
 * Servicio para gestión de usuarios del tenant (CRUD).
 * Endpoints: /admin/users
 *
 * Utiliza ApiClientService que automáticamente incluye:
 * - X-Tenant-Slug header
 * - Authorization Bearer token
 */

import { Injectable, inject } from '@angular/core';
import { ApiClientService } from '@pwa/core';
import { Observable } from 'rxjs';
import {
  TenantUsersResponse,
  TenantUserDetailDto,
  CreateTenantUserRequest,
  UpdateTenantUserRequest,
  UpdateUserRolesRequest,
  ResetPasswordRequest,
  UserListFilters,
} from '../models/tenant-user.model';

@Injectable({ providedIn: 'root' })
export class TenantUserService {
  private readonly apiClient = inject(ApiClientService);
  private readonly baseUrl = '/admin/users';

  /**
   * Listar todos los usuarios del tenant
   * GET /admin/users
   * @param filters Filtros opcionales para búsqueda y paginación
   */
  list(filters?: UserListFilters): Observable<TenantUsersResponse> {
    const params: Record<string, string> = {};

    if (filters?.search) params['search'] = filters.search;
    if (filters?.roleId) params['roleId'] = filters.roleId;
    if (filters?.isActive !== undefined)
      params['isActive'] = String(filters.isActive);
    if (filters?.page) params['page'] = String(filters.page);
    if (filters?.pageSize) params['pageSize'] = String(filters.pageSize);

    return this.apiClient.get<TenantUsersResponse>(this.baseUrl, { params });
  }

  /**
   * Listar usuarios administrativos/staff (sin rol Customer)
   * GET /admin/users/staff
   */
  listStaff(filters?: UserListFilters): Observable<TenantUsersResponse> {
    const params: Record<string, string> = {};

    if (filters?.search) params['search'] = filters.search;
    if (filters?.roleId) params['roleId'] = filters.roleId;
    if (filters?.isActive !== undefined)
      params['isActive'] = String(filters.isActive);
    if (filters?.page) params['page'] = String(filters.page);
    if (filters?.pageSize) params['pageSize'] = String(filters.pageSize);

    return this.apiClient.get<TenantUsersResponse>(`${this.baseUrl}/staff`, {
      params,
    });
  }

  /**
   * Listar usuarios customer
   * GET /admin/users/customers
   */
  listCustomers(filters?: UserListFilters): Observable<TenantUsersResponse> {
    const params: Record<string, string> = {};

    if (filters?.search) params['search'] = filters.search;
    if (filters?.roleId) params['roleId'] = filters.roleId;
    if (filters?.isActive !== undefined)
      params['isActive'] = String(filters.isActive);
    if (filters?.page) params['page'] = String(filters.page);
    if (filters?.pageSize) params['pageSize'] = String(filters.pageSize);

    return this.apiClient.get<TenantUsersResponse>(
      `${this.baseUrl}/customers`,
      {
        params,
      }
    );
  }

  /**
   * Obtener detalle completo de un usuario
   * GET /admin/users/{id}
   * @param id ID del usuario
   */
  getById(id: string): Observable<TenantUserDetailDto> {
    return this.apiClient.get<TenantUserDetailDto>(`${this.baseUrl}/${id}`);
  }

  /**
   * Crear un nuevo usuario
   * POST /admin/users
   * @param request Datos del nuevo usuario
   */
  create(request: CreateTenantUserRequest): Observable<TenantUserDetailDto> {
    return this.apiClient.post<TenantUserDetailDto>(this.baseUrl, request);
  }

  /**
   * Actualizar un usuario existente
   * PUT /admin/users/{id}
   * @param id ID del usuario
   * @param request Datos a actualizar
   */
  update(
    id: string,
    request: UpdateTenantUserRequest
  ): Observable<TenantUserDetailDto> {
    return this.apiClient.put<TenantUserDetailDto>(
      `${this.baseUrl}/${id}`,
      request
    );
  }

  /**
   * Actualizar roles de un usuario
   * PUT /admin/users/{id}/roles
   * @param id ID del usuario
   * @param request IDs de los roles a asignar
   */
  updateRoles(
    id: string,
    request: UpdateUserRolesRequest
  ): Observable<TenantUserDetailDto> {
    return this.apiClient.put<TenantUserDetailDto>(
      `${this.baseUrl}/${id}/roles`,
      request
    );
  }

  /**
   * Resetear contraseña de un usuario
   * POST /admin/users/{id}/reset-password
   * @param id ID del usuario
   * @param request Nueva contraseña
   */
  resetPassword(
    id: string,
    request: ResetPasswordRequest
  ): Observable<void> {
    return this.apiClient.post<void>(
      `${this.baseUrl}/${id}/reset-password`,
      request
    );
  }

  /**
   * Activar/Desactivar usuario
   * PATCH /admin/users/{id}/status
   * @param id ID del usuario
   * @param isActive Estado activo/inactivo
   */
  toggleStatus(id: string, isActive: boolean): Observable<void> {
    return this.apiClient.patch<void>(`${this.baseUrl}/${id}/status`, {
      isActive,
    });
  }

  /**
   * Eliminar un usuario
   * DELETE /admin/users/{id}
   * @param id ID del usuario
   * @returns Observable<void> - 204 No Content on success
   *
   * Errores esperados:
   * - 409 Conflict: Si el usuario es el único admin o tiene dependencias
   */
  delete(id: string): Observable<void> {
    return this.apiClient.delete<void>(`${this.baseUrl}/${id}`);
  }
}
