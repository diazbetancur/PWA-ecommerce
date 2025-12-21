import { inject, Injectable } from '@angular/core';
import { ApiClientService } from '@pwa/core';
import { firstValueFrom } from 'rxjs';
import {
  CreateTenantRequest,
  CreateTenantResponse,
  Plan,
  RepairTenantResponse,
  TenantDetail,
  TenantListParams,
  TenantListResponse,
  UpdateTenantRequest,
  UpdateTenantStatusRequest,
} from '../models/tenant.model';

/**
 * 🏢 Servicio de gestión de Tenants (SuperAdmin)
 *
 * Consume los endpoints:
 * - GET /admin/tenants (lista paginada)
 * - GET /admin/tenants/{id} (detalle)
 * - PATCH /admin/tenants/{id} (actualizar)
 * - PATCH /admin/tenants/{id}/status (cambiar status)
 * - DELETE /admin/tenants/{id} (eliminar)
 * - POST /superadmin/tenants (crear)
 * - POST /superadmin/tenants/repair (reparar)
 */
@Injectable({
  providedIn: 'root',
})
export class TenantAdminService {
  private readonly apiClient = inject(ApiClientService);

  /**
   * Obtiene la lista de planes disponibles
   */
  async getPlans(): Promise<Plan[]> {
    return firstValueFrom(this.apiClient.get<Plan[]>('/superadmin/plans'));
  }

  /**
   * Lista de tenants con paginación y filtros
   */
  async listTenants(params?: TenantListParams): Promise<TenantListResponse> {
    const queryParams: Record<string, string | number> = {
      page: params?.page || 1,
      pageSize: params?.pageSize || 20,
    };

    if (params?.search) {
      queryParams['search'] = params.search;
    }
    if (params?.status) {
      queryParams['status'] = params.status;
    }
    if (params?.planId) {
      queryParams['planId'] = params.planId;
    }

    return firstValueFrom(
      this.apiClient.get<TenantListResponse>('/admin/tenants', {
        params: queryParams,
      })
    );
  }

  /**
   * Obtiene el detalle de un tenant
   */
  async getTenantById(tenantId: string): Promise<TenantDetail> {
    return firstValueFrom(
      this.apiClient.get<TenantDetail>(`/admin/tenants/${tenantId}`)
    );
  }

  /**
   * Crea un nuevo tenant
   */
  async createTenant(
    request: CreateTenantRequest
  ): Promise<CreateTenantResponse> {
    const queryParams = new URLSearchParams({
      slug: request.slug,
      name: request.name,
      planCode: request.planCode,
    });

    return firstValueFrom(
      this.apiClient.post<CreateTenantResponse>(
        `/superadmin/tenants?${queryParams.toString()}`,
        null
      )
    );
  }

  /**
   * Actualiza un tenant existente
   */
  async updateTenant(
    tenantId: string,
    request: UpdateTenantRequest
  ): Promise<TenantDetail> {
    return firstValueFrom(
      this.apiClient.patch<TenantDetail>(`/admin/tenants/${tenantId}`, request)
    );
  }

  /**
   * Cambia el status de un tenant
   */
  async updateTenantStatus(
    tenantId: string,
    request: UpdateTenantStatusRequest
  ): Promise<TenantDetail> {
    return firstValueFrom(
      this.apiClient.patch<TenantDetail>(
        `/admin/tenants/${tenantId}/status`,
        request
      )
    );
  }

  /**
   * Elimina un tenant
   */
  async deleteTenant(tenantId: string): Promise<void> {
    return firstValueFrom(
      this.apiClient.delete<void>(`/admin/tenants/${tenantId}`)
    );
  }

  /**
   * Repara un tenant (reconstruye BD, esquemas, roles)
   */
  async repairTenant(slug: string): Promise<RepairTenantResponse> {
    const queryParams = new URLSearchParams({ tenant: slug });

    return firstValueFrom(
      this.apiClient.post<RepairTenantResponse>(
        `/superadmin/tenants/repair?${queryParams.toString()}`,
        null
      )
    );
  }
}
