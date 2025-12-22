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
import { ApiClientService } from '@pwa/core';
import { Observable } from 'rxjs';
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

    return this.apiClient.getWithParams<CategoryListResponse>(
      '/api/categories',
      queryParams
    );
  }

  /**
   * Obtener categoría por ID
   */
  getById(id: string): Observable<CategoryResponse> {
    return this.apiClient.get<CategoryResponse>(`/api/categories/${id}`);
  }

  /**
   * Obtener categoría por slug
   */
  getBySlug(slug: string): Observable<CategoryResponse> {
    return this.apiClient.get<CategoryResponse>(`/api/categories/slug/${slug}`);
  }

  /**
   * Crear nueva categoría
   * Requiere permiso "create" en módulo "categories"
   */
  create(request: CreateCategoryRequest): Observable<CategoryResponse> {
    return this.apiClient.post<CategoryResponse>('/api/categories', request);
  }

  /**
   * Actualizar categoría existente
   * Requiere permiso "update" en módulo "categories"
   */
  update(
    id: string,
    request: UpdateCategoryRequest
  ): Observable<CategoryResponse> {
    return this.apiClient.put<CategoryResponse>(
      `/api/categories/${id}`,
      request
    );
  }

  /**
   * Eliminar categoría
   * Requiere permiso "delete" en módulo "categories"
   * Los productos asociados NO se eliminan, solo se desvinculan
   */
  delete(id: string): Observable<void> {
    return this.apiClient.delete<void>(`/api/categories/${id}`);
  }
}
