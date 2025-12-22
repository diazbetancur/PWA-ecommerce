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

@Injectable({ providedIn: 'root' })
export class TenantAdminService {
  private readonly apiClient = inject(ApiClientService);

  async getPlans(): Promise<Plan[]> {
    return firstValueFrom(this.apiClient.get<Plan[]>('/superadmin/plans'));
  }

  async listTenants(params?: TenantListParams): Promise<TenantListResponse> {
    const queryParams: Record<string, string | number> = {
      page: params?.page || 1,
      pageSize: params?.pageSize || 20,
    };

    if (params?.search) queryParams['search'] = params.search;
    if (params?.status) queryParams['status'] = params.status;
    if (params?.planId) queryParams['planId'] = params.planId;

    return firstValueFrom(
      this.apiClient.get<TenantListResponse>('/admin/tenants', {
        params: queryParams,
      })
    );
  }

  async getTenantById(tenantId: string): Promise<TenantDetail> {
    return firstValueFrom(
      this.apiClient.get<TenantDetail>(`/admin/tenants/${tenantId}`)
    );
  }

  async createTenant(
    request: CreateTenantRequest
  ): Promise<CreateTenantResponse> {
    return firstValueFrom(
      this.apiClient.post<CreateTenantResponse>('/superadmin/tenants', request)
    );
  }

  async updateTenant(
    tenantId: string,
    request: UpdateTenantRequest
  ): Promise<TenantDetail> {
    return firstValueFrom(
      this.apiClient.patch<TenantDetail>(`/admin/tenants/${tenantId}`, request)
    );
  }

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

  async deleteTenant(tenantId: string): Promise<void> {
    return firstValueFrom(
      this.apiClient.delete<void>(`/admin/tenants/${tenantId}`)
    );
  }

  async repairTenant(slug: string): Promise<RepairTenantResponse> {
    return firstValueFrom(
      this.apiClient.post<RepairTenantResponse>(
        `/superadmin/tenants/repair?tenant=${slug}`,
        null
      )
    );
  }
}
