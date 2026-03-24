/**
 * 🏪 Servicio de Gestión de Categorías
 *
 * Servicio para operaciones CRUD de categorías del tenant.
 * Utiliza ApiClientService que automáticamente incluye:
 * - X-Tenant-Slug header
 * - Authorization header
 * - ?tenant= query parameter (cuando aplica)
 */

import { Injectable, inject } from '@angular/core';
import { ApiClientService, AppEnvService } from '@pwa/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import {
  CategoryListParams,
  CategoryListResponse,
  CategoryResponse,
  CreateCategoryRequest,
  UpdateCategoryRequest,
} from '../models/category.model';

@Injectable({ providedIn: 'root' })
export class CategoryService {
  private readonly apiClient = inject(ApiClientService);
  private readonly env = inject(AppEnvService);

  /**
   * Listar categorías con paginación y filtros
   */
  list(params?: CategoryListParams): Observable<CategoryListResponse> {
    const queryParams: Record<string, string | number | boolean> = {};

    if (params?.page) queryParams['page'] = params.page;
    if (params?.pageSize) queryParams['pageSize'] = params.pageSize;
    if (params?.search) queryParams['search'] = params.search;
    if (params?.isActive !== undefined)
      queryParams['isActive'] = params.isActive;
    if (params?.parentId) queryParams['parentId'] = params.parentId;

    return this.apiClient
      .getWithParams<CategoryListResponse>('/api/categories', queryParams)
      .pipe(map((response) => this.normalizeCategoryListResponse(response)));
  }

  /**
   * Obtener categoría por ID
   */
  getById(id: string): Observable<CategoryResponse> {
    return this.apiClient
      .get<CategoryResponse>(`/api/categories/${id}`)
      .pipe(map((response) => this.normalizeCategoryResponse(response)));
  }

  /**
   * Obtener categoría por slug
   */
  getBySlug(slug: string): Observable<CategoryResponse> {
    return this.apiClient
      .get<CategoryResponse>(`/api/categories/slug/${slug}`)
      .pipe(map((response) => this.normalizeCategoryResponse(response)));
  }

  /**
   * Crear nueva categoría
   * Requiere permiso "create" en módulo "categories"
   */
  create(request: CreateCategoryRequest): Observable<CategoryResponse> {
    return this.apiClient
      .post<CategoryResponse>('/api/categories', this.buildFormData(request))
      .pipe(map((response) => this.normalizeCategoryResponse(response)));
  }

  /**
   * Actualizar categoría existente
   * Requiere permiso "update" en módulo "categories"
   */
  update(
    id: string,
    request: UpdateCategoryRequest
  ): Observable<CategoryResponse> {
    return this.apiClient
      .put<CategoryResponse>(
        `/api/categories/${id}`,
        this.buildFormData(request)
      )
      .pipe(map((response) => this.normalizeCategoryResponse(response)));
  }

  /**
   * Eliminar categoría
   * Requiere permiso "delete" en módulo "categories"
   * Los productos asociados NO se eliminan, solo se desvinculan
   */
  delete(id: string): Observable<void> {
    return this.apiClient.delete<void>(`/api/categories/${id}`);
  }

  private buildFormData(
    request: CreateCategoryRequest | UpdateCategoryRequest
  ): FormData {
    const formData = new FormData();

    if (request.name !== undefined) {
      formData.append('name', request.name);
    }

    if (request.description !== undefined) {
      formData.append('description', request.description ?? '');
    }

    if (request.isActive !== undefined) {
      formData.append('isActive', String(request.isActive));
    }

    if (request.parentId) {
      formData.append('parentId', request.parentId);
    }

    if (request.image) {
      formData.append('image', request.image);
    }

    return formData;
  }

  private normalizeCategoryListResponse(
    response: CategoryListResponse
  ): CategoryListResponse {
    return {
      ...response,
      items: response.items.map((item) => ({
        ...item,
        imageUrl: this.resolvePublicImageUrl(item.imageUrl),
      })),
    };
  }

  private normalizeCategoryResponse(
    response: CategoryResponse
  ): CategoryResponse {
    return {
      ...response,
      imageUrl: this.resolvePublicImageUrl(response.imageUrl),
    };
  }

  private resolvePublicImageUrl(imageUrl?: string): string | undefined {
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
