/**
 * 🔐 Permission Service
 *
 * Servicio para gestión de permisos por rol.
 * Endpoints: /admin/roles/available-modules, /admin/roles/{id}/permissions
 *
 * Utiliza ApiClientService que automáticamente incluye:
 * - X-Tenant-Slug header
 * - Authorization Bearer token
 */

import { Injectable, inject } from '@angular/core';
import { ApiClientService } from '@pwa/core';
import { Observable } from 'rxjs';
import {
  AvailableModulesResponse,
  RolePermissionsResponse,
  UpdateRolePermissionsRequest,
} from '../models/rbac.model';

@Injectable({ providedIn: 'root' })
export class PermissionService {
  private readonly apiClient = inject(ApiClientService);
  private readonly baseUrl = '/admin/roles';

  /**
   * Obtener módulos disponibles en el sistema
   * GET /admin/roles/available-modules
   *
   * Retorna todos los módulos con sus permisos disponibles.
   * Solo módulos activos (isActive=true) se deben mostrar en la UI.
   */
  getAvailableModules(): Observable<AvailableModulesResponse> {
    return this.apiClient.get<AvailableModulesResponse>(
      `${this.baseUrl}/available-modules`
    );
  }

  /**
   * Obtener permisos actuales de un rol
   * GET /admin/roles/{id}/permissions
   * @param roleId ID del rol
   */
  getRolePermissions(roleId: string): Observable<RolePermissionsResponse> {
    return this.apiClient.get<RolePermissionsResponse>(
      `${this.baseUrl}/${roleId}/permissions`
    );
  }

  /**
   * Actualizar permisos de un rol
   * PUT /admin/roles/{id}/permissions
   * @param roleId ID del rol
   * @param request Permisos a actualizar
   *
   * Solo se deben enviar módulos con al menos un permiso activado.
   * El backend eliminará permisos de módulos no incluidos en el request.
   */
  updateRolePermissions(
    roleId: string,
    request: UpdateRolePermissionsRequest
  ): Observable<RolePermissionsResponse> {
    return this.apiClient.put<RolePermissionsResponse>(
      `${this.baseUrl}/${roleId}/permissions`,
      request
    );
  }
}
