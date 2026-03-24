import { HttpResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiClientService } from './api-client.service';
import { AppEnvService } from './app-env.service';

export interface StorePopupResponse {
  id: string;
  imageUrl?: string | null;
  targetUrl?: string | null;
  buttonText?: string | null;
  isActive?: boolean;
  startDate?: string | null;
  endDate?: string | null;
}

@Injectable({ providedIn: 'root' })
export class PublicPopupService {
  private readonly apiClient = inject(ApiClientService);
  private readonly env = inject(AppEnvService);

  getActivePopup(): Observable<StorePopupResponse | null> {
    return this.apiClient
      .getWithResponse<StorePopupResponse | null>('/api/store/popup')
      .pipe(
        map((response: HttpResponse<StorePopupResponse | null>) => {
          if (response.status === 204) {
            return null;
          }

          if (!response.body) {
            return null;
          }

          return this.normalizePopupResponse(response.body);
        })
      );
  }

  private normalizePopupResponse(
    response: StorePopupResponse
  ): StorePopupResponse {
    return {
      ...response,
      imageUrl: this.resolvePublicImageUrl(response.imageUrl),
    };
  }

  private resolvePublicImageUrl(
    imageUrl?: string | null
  ): string | null | undefined {
    if (!imageUrl) {
      return imageUrl;
    }

    if (
      imageUrl.startsWith('http://') ||
      imageUrl.startsWith('https://') ||
      imageUrl.startsWith('data:') ||
      imageUrl.startsWith('blob:')
    ) {
      return imageUrl;
    }

    const baseUrl = this.env.categoryPublicBaseUrl;
    if (!baseUrl) {
      return imageUrl;
    }

    const normalizedBase = baseUrl.endsWith('/')
      ? baseUrl.slice(0, -1)
      : baseUrl;
    const normalizedPath = imageUrl.startsWith('/') ? imageUrl : `/${imageUrl}`;

    return `${normalizedBase}${normalizedPath}`;
  }
}
