/**
 * 🔐 Role Service
 *
 * Servicio para gestión de roles (CRUD).
 * Endpoints: /admin/roles
 *
 * Utiliza ApiClientService que automáticamente incluye:
 * - X-Tenant-Slug header
 * - Authorization Bearer token
 */

import { Injectable, inject } from '@angular/core';
import { ApiClientService } from '@pwa/core';
import { Observable } from 'rxjs';
import {
  RolesResponse,
  RoleDetailDto,
  CreateRoleRequest,
  UpdateRoleRequest,
} from '../models/rbac.model';

@Injectable({ providedIn: 'root' })
export class RoleService {
  private readonly apiClient = inject(ApiClientService);
  private readonly baseUrl = '/admin/roles';

  /**
   * Listar todos los roles del tenant
   * GET /admin/roles
   */
  list(): Observable<RolesResponse> {
    return this.apiClient.get<RolesResponse>(this.baseUrl);
  }

  /**
   * Obtener detalle completo de un rol
   * GET /admin/roles/{id}
   * @param id ID del rol
   */
  getById(id: string): Observable<RoleDetailDto> {
    return this.apiClient.get<RoleDetailDto>(`${this.baseUrl}/${id}`);
  }

  /**
   * Crear un nuevo rol
   * POST /admin/roles
   * @param request Datos del nuevo rol
   */
  create(request: CreateRoleRequest): Observable<RoleDetailDto> {
    return this.apiClient.post<RoleDetailDto>(this.baseUrl, request);
  }

  /**
   * Actualizar un rol existente
   * PUT /admin/roles/{id}
   * @param id ID del rol
   * @param request Datos a actualizar
   */
  update(id: string, request: UpdateRoleRequest): Observable<RoleDetailDto> {
    return this.apiClient.put<RoleDetailDto>(`${this.baseUrl}/${id}`, request);
  }

  /**
   * Eliminar un rol
   * DELETE /admin/roles/{id}
   * @param id ID del rol
   * @returns Observable<void> - 204 No Content on success
   *
   * Errores esperados:
   * - 409 Conflict: Si el rol tiene usuarios asignados o es rol del sistema
   */
  delete(id: string): Observable<void> {
    return this.apiClient.delete<void>(`${this.baseUrl}/${id}`);
  }
}
