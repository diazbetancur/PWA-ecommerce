import { Injectable, inject } from '@angular/core';
import { ApiClientService, AppEnvService } from '@pwa/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import {
  BannerListParams,
  BannerListResponse,
  BannerResponse,
  CreateBannerRequest,
  UpdateBannerRequest,
} from '../models/banner.model';

@Injectable({ providedIn: 'root' })
export class BannerService {
  private readonly apiClient = inject(ApiClientService);
  private readonly env = inject(AppEnvService);

  list(params?: BannerListParams): Observable<BannerListResponse> {
    const queryParams: Record<string, string | number | boolean> = {};

    if (params?.page) queryParams['page'] = params.page;
    if (params?.pageSize) queryParams['pageSize'] = params.pageSize;
    if (params?.search) queryParams['search'] = params.search;
    if (params?.position) queryParams['position'] = params.position;
    if (params?.isActive !== undefined)
      queryParams['isActive'] = params.isActive;

    return this.apiClient
      .getWithParams<BannerListResponse>('/api/admin/banners', queryParams)
      .pipe(map((response) => this.normalizeBannerListResponse(response)));
  }

  getById(id: string): Observable<BannerResponse> {
    return this.apiClient
      .get<BannerResponse>(`/api/admin/banners/${id}`)
      .pipe(map((response) => this.normalizeBannerResponse(response)));
  }

  create(request: CreateBannerRequest): Observable<BannerResponse> {
    return this.apiClient
      .post<BannerResponse>('/api/admin/banners', this.buildFormData(request))
      .pipe(map((response) => this.normalizeBannerResponse(response)));
  }

  update(id: string, request: UpdateBannerRequest): Observable<BannerResponse> {
    return this.apiClient
      .put<BannerResponse>(
        `/api/admin/banners/${id}`,
        this.buildFormData(request)
      )
      .pipe(map((response) => this.normalizeBannerResponse(response)));
  }

  delete(id: string): Observable<void> {
    return this.apiClient.delete<void>(`/api/admin/banners/${id}`);
  }

  private buildFormData(
    request: CreateBannerRequest | UpdateBannerRequest
  ): FormData {
    const formData = new FormData();

    if (request.title !== undefined) formData.append('title', request.title);
    if (request.subtitle !== undefined)
      formData.append('subtitle', request.subtitle ?? '');
    if (request.targetUrl !== undefined)
      formData.append('targetUrl', request.targetUrl ?? '');
    if (request.buttonText !== undefined)
      formData.append('buttonText', request.buttonText ?? '');
    if (request.position !== undefined)
      formData.append('position', request.position);
    if (request.startDate !== undefined)
      formData.append('startDate', request.startDate ?? '');
    if (request.endDate !== undefined)
      formData.append('endDate', request.endDate ?? '');
    if (request.displayOrder !== undefined)
      formData.append('displayOrder', String(request.displayOrder));
    if (request.isActive !== undefined)
      formData.append('isActive', String(request.isActive));
    if (request.image) formData.append('image', request.image);

    return formData;
  }

  private normalizeBannerListResponse(
    response: BannerListResponse
  ): BannerListResponse {
    return {
      ...response,
      items: response.items.map((item) => ({
        ...item,
        imageUrl: this.resolvePublicImageUrl(item.imageUrl) ?? item.imageUrl,
        position: this.normalizePosition(item.position),
      })),
    };
  }

  private normalizeBannerResponse(response: BannerResponse): BannerResponse {
    return {
      ...response,
      imageUrl: this.resolvePublicImageUrl(response.imageUrl),
      position: this.normalizePosition(response.position),
    };
  }

  private normalizePosition(position?: string | null): string {
    if (!position) {
      return 'Hero';
    }

    const lower = position.toLowerCase();
    if (lower === 'hero') return 'Hero';
    if (lower === 'secondary') return 'Secondary';
    if (lower === 'sidebar') return 'Sidebar';
    if (lower === 'popup') return 'Popup';
    if (lower === 'footer') return 'Footer';

    return position;
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
