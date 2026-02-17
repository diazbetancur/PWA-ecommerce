import { Injectable, inject } from '@angular/core';
import { ApiClientService } from '@pwa/core';
import { Observable } from 'rxjs';
import {
  TenantBrandingSettings,
  TenantContactSettings,
  TenantSettingsDto,
  TenantSocialSettings,
  UpdateTenantSettingsRequest,
} from '../models/tenant-settings.model';

@Injectable({ providedIn: 'root' })
export class TenantSettingsService {
  private readonly apiClient = inject(ApiClientService);
  private readonly baseUrl = '/admin/settings';

  getSettings(): Observable<TenantSettingsDto> {
    return this.apiClient.get<TenantSettingsDto>(this.baseUrl);
  }

  updateSettings(
    request: UpdateTenantSettingsRequest
  ): Observable<TenantSettingsDto> {
    return this.apiClient.put<TenantSettingsDto>(this.baseUrl, request);
  }

  updateBranding(
    request: Partial<TenantBrandingSettings>
  ): Observable<TenantSettingsDto> {
    return this.apiClient.patch<TenantSettingsDto>(
      `${this.baseUrl}/branding`,
      request
    );
  }

  updateContact(
    request: Partial<TenantContactSettings>
  ): Observable<TenantSettingsDto> {
    return this.apiClient.patch<TenantSettingsDto>(
      `${this.baseUrl}/contact`,
      request
    );
  }

  updateSocial(
    request: Partial<TenantSocialSettings>
  ): Observable<TenantSettingsDto> {
    return this.apiClient.patch<TenantSettingsDto>(
      `${this.baseUrl}/social`,
      request
    );
  }
}
