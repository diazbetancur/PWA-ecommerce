import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { PagedResult, ProductResponse } from '../models/types';
import { ApiClientService } from './api-client.service';

/**
 * Filtros para productos públicos
 */
export interface PublicProductFilters {
  page?: number;
  pageSize?: number;
  search?: string;
  categoryId?: string;
  minPrice?: number;
  maxPrice?: number;
  sortBy?: 'name' | 'price' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

/**
 * Servicio para consulta pública de productos
 * NO requiere autenticación, solo header X-Tenant-Slug
 */
@Injectable({ providedIn: 'root' })
export class PublicProductService {
  private readonly apiClient = inject(ApiClientService);
  private readonly baseUrl = '/api/products';

  /**
   * Obtiene lista paginada de productos públicos (isActive=true)
   * Solo muestra productos activos del tenant
   */
  list(
    filters?: PublicProductFilters
  ): Observable<PagedResult<ProductResponse>> {
    const params: Record<string, string> = {};

    if (filters) {
      if (filters.page) params['page'] = filters.page.toString();
      if (filters.pageSize) params['pageSize'] = filters.pageSize.toString();
      if (filters.search) params['search'] = filters.search;
      if (filters.categoryId) params['categoryId'] = filters.categoryId;
      if (filters.minPrice !== undefined)
        params['minPrice'] = filters.minPrice.toString();
      if (filters.maxPrice !== undefined)
        params['maxPrice'] = filters.maxPrice.toString();
      if (filters.sortBy) params['sortBy'] = filters.sortBy;
      if (filters.sortOrder) params['sortOrder'] = filters.sortOrder;
    }

    const queryString = new URLSearchParams(params).toString();
    const url = queryString ? `${this.baseUrl}?${queryString}` : this.baseUrl;

    return this.apiClient.get<PagedResult<ProductResponse>>(url);
  }

  /**
   * Obtiene un producto por su ID
   */
  getById(id: string): Observable<ProductResponse> {
    return this.apiClient.get<ProductResponse>(`${this.baseUrl}/${id}`);
  }

  /**
   * Obtiene un producto por su slug
   */
  getBySlug(slug: string): Observable<ProductResponse> {
    return this.apiClient.get<ProductResponse>(`${this.baseUrl}/slug/${slug}`);
  }
}
