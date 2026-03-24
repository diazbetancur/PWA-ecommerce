import { Injectable, inject } from '@angular/core';
import { ApiClientService, AppEnvService } from '@pwa/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import {
  CreatePopupRequest,
  PopupListParams,
  PopupListResponse,
  PopupResponse,
  UpdatePopupRequest,
} from '../models/popup.model';

@Injectable({ providedIn: 'root' })
export class PopupService {
  private readonly apiClient = inject(ApiClientService);
  private readonly env = inject(AppEnvService);

  list(params?: PopupListParams): Observable<PopupListResponse> {
    const queryParams: Record<string, string | number | boolean> = {};

    if (params?.page) queryParams['page'] = params.page;
    if (params?.pageSize) queryParams['pageSize'] = params.pageSize;
    if (params?.isActive !== undefined)
      queryParams['isActive'] = params.isActive;

    return this.apiClient
      .getWithParams<PopupListResponse>('/api/admin/popups', queryParams)
      .pipe(map((response) => this.normalizePopupListResponse(response)));
  }

  getById(id: string): Observable<PopupResponse> {
    return this.apiClient
      .get<PopupResponse>(`/api/admin/popups/${id}`)
      .pipe(map((response) => this.normalizePopupResponse(response)));
  }

  create(request: CreatePopupRequest): Observable<PopupResponse> {
    return this.apiClient
      .post<PopupResponse>('/api/admin/popups', this.buildFormData(request))
      .pipe(map((response) => this.normalizePopupResponse(response)));
  }

  update(id: string, request: UpdatePopupRequest): Observable<PopupResponse> {
    return this.apiClient
      .put<PopupResponse>(
        `/api/admin/popups/${id}`,
        this.buildFormData(request)
      )
      .pipe(map((response) => this.normalizePopupResponse(response)));
  }

  delete(id: string): Observable<void> {
    return this.apiClient.delete<void>(`/api/admin/popups/${id}`);
  }

  private buildFormData(
    request: CreatePopupRequest | UpdatePopupRequest
  ): FormData {
    const formData = new FormData();

    if (request.isActive !== undefined) {
      formData.append('isActive', String(request.isActive));
    }

    if (request.startDate !== undefined) {
      formData.append('startDate', request.startDate ?? '');
    }

    if (request.endDate !== undefined) {
      formData.append('endDate', request.endDate ?? '');
    }

    if (request.targetUrl !== undefined) {
      formData.append('targetUrl', request.targetUrl ?? '');
    }

    if (request.buttonText !== undefined) {
      formData.append('buttonText', request.buttonText ?? '');
    }

    formData.append('image', request.image);

    return formData;
  }

  private normalizePopupListResponse(
    response: PopupListResponse
  ): PopupListResponse {
    return {
      ...response,
      items: response.items.map((item) => ({
        ...item,
        imageUrl: this.resolvePublicImageUrl(item.imageUrl),
      })),
    };
  }

  private normalizePopupResponse(response: PopupResponse): PopupResponse {
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
