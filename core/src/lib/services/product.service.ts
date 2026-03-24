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
    if (this.hasMediaFiles(product)) {
      return this.apiClient.post<ProductResponse>(
        this.baseUrl,
        this.buildFormData(product)
      );
    }

    return this.apiClient.post<ProductResponse>(this.baseUrl, product);
  }

  /**
   * Actualiza un producto existente
   * Requiere: catalog.canUpdate
   */
  update(id: string, product: UpdateProductDto): Observable<ProductResponse> {
    if (this.hasMediaFiles(product)) {
      return this.apiClient.put<ProductResponse>(
        `${this.baseUrl}/${id}`,
        this.buildFormData(product)
      );
    }

    return this.apiClient.put<ProductResponse>(
      `${this.baseUrl}/${id}`,
      product
    );
  }

  private hasMediaFiles(product: CreateProductDto | UpdateProductDto): boolean {
    return !!(
      product.mainImage ||
      (product.images && product.images.length > 0) ||
      (product.videos && product.videos.length > 0)
    );
  }

  private buildFormData(
    product: CreateProductDto | UpdateProductDto
  ): FormData {
    const formData = new FormData();

    if (product.name !== undefined) formData.append('name', product.name);
    if (product.sku !== undefined) formData.append('sku', product.sku || '');
    if (product.description !== undefined)
      formData.append('description', product.description || '');
    if (product.shortDescription !== undefined)
      formData.append('shortDescription', product.shortDescription || '');
    if (product.price !== undefined)
      formData.append('price', String(product.price));
    if (product.compareAtPrice !== undefined)
      formData.append('compareAtPrice', String(product.compareAtPrice ?? ''));
    if (product.stock !== undefined)
      formData.append('stock', String(product.stock));
    if (product.trackInventory !== undefined)
      formData.append('trackInventory', String(product.trackInventory));
    if (product.isOnSale !== undefined)
      formData.append('isOnSale', String(product.isOnSale));
    if (product.isTaxIncluded !== undefined)
      formData.append('isTaxIncluded', String(product.isTaxIncluded));
    if (product.taxPercentage !== undefined)
      formData.append('taxPercentage', String(product.taxPercentage));
    if (product.isActive !== undefined)
      formData.append('isActive', String(product.isActive));
    if (product.isFeatured !== undefined)
      formData.append('isFeatured', String(product.isFeatured));
    if (product.tags !== undefined) formData.append('tags', product.tags || '');
    if (product.brand !== undefined)
      formData.append('brand', product.brand || '');
    if (product.metaTitle !== undefined)
      formData.append('metaTitle', product.metaTitle || '');
    if (product.metaDescription !== undefined)
      formData.append('metaDescription', product.metaDescription || '');

    if (product.categoryIds && product.categoryIds.length > 0) {
      for (const categoryId of product.categoryIds) {
        formData.append('categoryIds', categoryId);
      }
    }

    if (product.initialStoreStock && product.initialStoreStock.length > 0) {
      product.initialStoreStock.forEach((item, index) => {
        formData.append(`initialStoreStock[${index}].storeId`, item.storeId);
        formData.append(
          `initialStoreStock[${index}].stock`,
          String(item.stock)
        );
      });
    }

    if (product.mainImage) {
      formData.append('mainImage', product.mainImage);
    }

    if (product.images && product.images.length > 0) {
      for (const image of product.images) {
        formData.append('images', image);
      }
    }

    if (product.videos && product.videos.length > 0) {
      for (const video of product.videos) {
        formData.append('videos', video);
      }
    }

    return formData;
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
