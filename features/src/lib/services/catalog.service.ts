import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiClientService, TenantContextService } from '@pwa/core';

export interface CatalogProduct {
  id: string;
  name: string;
  price: number;
  description: string;
  imageUrl: string;
  categoryId: string;
  sku?: string;
  stock?: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CatalogCategory {
  id: string;
  name: string;
  description: string;
  imageUrl?: string;
  parentId?: string;
  sortOrder?: number;
  active: boolean;
}

export interface CatalogApiResponse<T> {
  success: boolean;
  data: T[];
  total?: number;
  page?: number;
  pageSize?: number;
  message?: string;
}

export interface ProductFilters {
  categoryId?: string;
  minPrice?: number;
  maxPrice?: number;
  search?: string;
  active?: boolean;
  inStock?: boolean;
}

/**
 * Servicio de catálogo que utiliza ApiClientService
 * Los headers de tenant se añaden automáticamente via TenantHeaderInterceptor
 */
@Injectable({
  providedIn: 'root'
})
export class CatalogService {
  private readonly apiClient = inject(ApiClientService);
  private readonly tenantContext = inject(TenantContextService);

  /**
   * Obtiene los productos del catálogo
   * Los headers de tenant se añaden automáticamente
   */
  getProducts(
    page = 1,
    pageSize = 20,
    filters?: ProductFilters
  ): Observable<CatalogApiResponse<CatalogProduct>> {
    const params: Record<string, string | number | boolean> = {
      page,
      pageSize
    };

    // Agregar filtros si existen
    if (filters) {
      if (filters.categoryId) params['categoryId'] = filters.categoryId;
      if (filters.minPrice !== undefined) params['minPrice'] = filters.minPrice;
      if (filters.maxPrice !== undefined) params['maxPrice'] = filters.maxPrice;
      if (filters.search) params['search'] = filters.search;
      if (filters.active !== undefined) params['active'] = filters.active;
      if (filters.inStock !== undefined) params['inStock'] = filters.inStock;
    }

    return this.apiClient.getWithParams<CatalogApiResponse<CatalogProduct>>(
      '/api/catalog/products',
      params
    );
  }

  /**
   * Obtiene un producto específico por ID
   */
  getProduct(productId: string): Observable<CatalogProduct> {
    return this.apiClient.get<CatalogProduct>(`/api/catalog/products/${productId}`);
  }    /**
   * Obtiene las categorías del catálogo
   */
  getCategories(includeInactive = false): Observable<CatalogApiResponse<CatalogCategory>> {
    const params: Record<string, boolean> = {};
    if (includeInactive) {
      params['includeInactive'] = true;
    }

    return this.apiClient.getWithParams<CatalogApiResponse<CatalogCategory>>(
      '/api/catalog/categories',
      params
    );
  }

  /**
   * Busca productos por texto
   */
  searchProducts(
    query: string,
    page = 1,
    pageSize = 20,
    filters?: Omit<ProductFilters, 'search'>
  ): Observable<CatalogApiResponse<CatalogProduct>> {
    const params: Record<string, string | number | boolean> = {
      q: query,
      page,
      pageSize
    };

    // Combinar con otros filtros
    if (filters) {
      if (filters.categoryId) params['categoryId'] = filters.categoryId;
      if (filters.minPrice !== undefined) params['minPrice'] = filters.minPrice;
      if (filters.maxPrice !== undefined) params['maxPrice'] = filters.maxPrice;
      if (filters.active !== undefined) params['active'] = filters.active;
      if (filters.inStock !== undefined) params['inStock'] = filters.inStock;
    }

    return this.apiClient.getWithParams<CatalogApiResponse<CatalogProduct>>(
      '/api/catalog/search',
      params
    );
  }

  /**
   * Obtiene productos destacados
   */
  getFeaturedProducts(limit = 10): Observable<CatalogApiResponse<CatalogProduct>> {
    return this.apiClient.getWithParams<CatalogApiResponse<CatalogProduct>>(
      '/api/catalog/products/featured',
      { limit }
    );
  }

  /**
   * Obtiene productos de una categoría específica
   */
  getProductsByCategory(categoryId: string, page = 1, pageSize = 20): Observable<CatalogApiResponse<CatalogProduct>> {
    return this.getProducts(page, pageSize, { categoryId });
  }

  /**
   * Obtiene productos relacionados
   */
  getRelatedProducts(productId: string, limit = 5): Observable<CatalogApiResponse<CatalogProduct>> {
    return this.apiClient.getWithParams<CatalogApiResponse<CatalogProduct>>(
      `/api/catalog/products/${productId}/related`,
      { limit }
    );
  }

  // === UTILIDADES DEL TENANT ===

  /**
   * Obtiene la configuración actual del tenant
   * Delegamos al TenantContextService
   */
  getCurrentTenantInfo() {
    const config = this.tenantContext.getCurrentTenantConfig();
    if (!config) {
      return null;
    }

    return {
      id: config.tenant.id,
      slug: config.tenant.slug,
      displayName: config.tenant.displayName,
      currency: config.currency,
      locale: config.locale,
      cdnBaseUrl: config.cdnBaseUrl
    };
  }

  /**
   * Construye URLs de imágenes usando el CDN del tenant
   */
  buildImageUrl(imagePath: string): string {
    const config = this.tenantContext.getCurrentTenantConfig();

    if (!config?.cdnBaseUrl) {
      return imagePath; // Retornar la ruta original si no hay CDN configurado
    }

    // Si la imagen ya es una URL completa, retornarla tal como está
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      return imagePath;
    }

    // Construir la URL usando el CDN base del tenant
    const cdnBase = config.cdnBaseUrl.endsWith('/') ?
      config.cdnBaseUrl :
      `${config.cdnBaseUrl}/`;

    const cleanPath = imagePath.startsWith('/') ? imagePath.substring(1) : imagePath;

    return `${cdnBase}${cleanPath}`;
  }

  /**
   * Verifica si el contexto del tenant está listo
   */
  isTenantReady(): boolean {
    return this.tenantContext.isTenantReady();
  }
}
