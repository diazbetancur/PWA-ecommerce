import { Injectable, inject } from '@angular/core';
import { ApiClientService } from '@pwa/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import {
  TenantBrandingSettings,
  TenantContactSettings,
  TenantSettingsDto,
  TenantSocialSettings,
  UpdateTenantBrandingRequest,
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
    request: UpdateTenantBrandingRequest
  ): Observable<TenantBrandingSettings> {
    return this.apiClient
      .patch<TenantBrandingSettings | TenantSettingsDto>(
        `${this.baseUrl}/branding`,
        this.buildBrandingFormData(request)
      )
      .pipe(map((response) => this.extractBrandingResponse(response)));
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

  private buildBrandingFormData(
    request: UpdateTenantBrandingRequest
  ): FormData {
    const formData = new FormData();
    const logoFile = request.logo ?? request.logoFile;
    const faviconFile = request.favicon ?? request.faviconFile;

    if (logoFile && logoFile.size > 0) {
      formData.append('logo', logoFile);
    }

    if (faviconFile && faviconFile.size > 0) {
      formData.append('favicon', faviconFile);
    }

    if (request.primaryColor !== undefined) {
      formData.append('primaryColor', request.primaryColor);
    }

    if (request.secondaryColor !== undefined) {
      formData.append('secondaryColor', request.secondaryColor);
    }

    if (request.accentColor !== undefined) {
      formData.append('accentColor', request.accentColor);
    }

    if (request.backgroundColor !== undefined) {
      formData.append('backgroundColor', request.backgroundColor);
    }

    return formData;
  }

  private extractBrandingResponse(
    response: TenantBrandingSettings | TenantSettingsDto
  ): TenantBrandingSettings {
    return 'branding' in response ? response.branding : response;
  }
}
