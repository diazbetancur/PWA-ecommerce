import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import {
  CreateProductDto,
  PagedResult,
  ProductFilterDto,
  ProductResponse,
  UpdateProductDto,
  UpdateStockDto,
} from '../models/types';
import { ApiClientService } from './api-client.service';

/**
 * Servicio para gestión de productos del catálogo
 * Requiere módulo 'catalog' para todos los endpoints
 */
@Injectable({ providedIn: 'root' })
export class ProductService {
  private readonly apiClient = inject(ApiClientService);
  private readonly baseUrl = '/api/admin/products';

  /**
   * Obtiene lista paginada de productos con filtros opcionales
   * Requiere: catalog.canView
   */
  list(filters?: ProductFilterDto): Observable<PagedResult<ProductResponse>> {
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
      if (filters.isActive !== undefined)
        params['isActive'] = filters.isActive.toString();
      if (filters.isFeatured !== undefined)
        params['isFeatured'] = filters.isFeatured.toString();
      if (filters.sortBy) params['sortBy'] = filters.sortBy;
      if (filters.sortOrder) params['sortOrder'] = filters.sortOrder;
    }

    const queryString = new URLSearchParams(params).toString();
    const url = queryString ? `${this.baseUrl}?${queryString}` : this.baseUrl;

    return this.apiClient.get<PagedResult<ProductResponse>>(url);
  }

  /**
   * Obtiene un producto por su ID
   * Requiere: catalog.canView
   */
  getById(id: string): Observable<ProductResponse> {
    return this.apiClient.get<ProductResponse>(`${this.baseUrl}/${id}`);
  }

  /**
   * Obtiene un producto por su slug
   * Requiere: catalog.canView
   */
  getBySlug(slug: string): Observable<ProductResponse> {
    return this.apiClient.get<ProductResponse>(`${this.baseUrl}/slug/${slug}`);
  }

  /**
   * Crea un nuevo producto
   * Requiere: catalog.canCreate
   */
  create(product: CreateProductDto): Observable<ProductResponse> {
    return this.apiClient.post<ProductResponse>(this.baseUrl, product);
  }

  /**
   * Actualiza un producto existente
   * Requiere: catalog.canUpdate
   */
  update(id: string, product: UpdateProductDto): Observable<ProductResponse> {
    return this.apiClient.put<ProductResponse>(
      `${this.baseUrl}/${id}`,
      product
    );
  }

  /**
   * Elimina un producto (soft delete)
   * Requiere: catalog.canDelete
   */
  delete(id: string): Observable<void> {
    return this.apiClient.delete<void>(`${this.baseUrl}/${id}`);
  }

  /**
   * Actualiza el stock de un producto
   * Requiere: catalog.canUpdate
   */
  updateStock(id: string, quantity: number): Observable<void> {
    const dto: UpdateStockDto = { quantity };
    return this.apiClient.patch<void>(`${this.baseUrl}/${id}/stock`, dto);
  }

  /**
   * Alterna el estado de producto destacado
   * Requiere: catalog.canUpdate
   */
  toggleFeatured(id: string): Observable<void> {
    return this.apiClient.patch<void>(
      `${this.baseUrl}/${id}/toggle-featured`,
      {}
    );
  }
}
