/**
 * 🏪 Storefront API Service
 *
 * Servicio para consumir la API pública de Storefront.
 * Base URL: /api/store
 *
 * ⚠️ IMPORTANTE:
 * - Los endpoints NO requieren autenticación (son públicos)
 * - REQUIEREN el header X-Tenant-Slug (se agrega automáticamente por el interceptor)
 * - Utiliza ApiClientService que maneja automáticamente:
 *   - X-Tenant-Slug header
 *   - Manejo de errores
 *   - Construcción de URLs
 */

import { Injectable, inject } from '@angular/core';
import { ApiClientService } from '@pwa/core';
import { Observable } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import {
  ProductFilters,
  StoreBannerDto,
  StoreCategoryDetailDto,
  StoreCategoryDto,
  StoreProductDetailDto,
  StoreProductDto,
  StoreProductListResponse,
  StoreProductSearchResult,
} from '../models/storefront-api.models';

@Injectable({
  providedIn: 'root',
})
export class StorefrontApiService {
  private readonly apiClient = inject(ApiClientService);

  // ============================================
  // BANNERS
  // ============================================

  /**
   * Obtiene los banners activos de la tienda
   * GET /api/store/banners?position={position}
   *
   * @param position - Filtrar por posición (hero, sidebar, footer, promo)
   */
  getBanners(
    position?: 'hero' | 'sidebar' | 'footer' | 'promo'
  ): Observable<StoreBannerDto[]> {
    const params: Record<string, string> = {};
    if (position) {
      params['position'] = position;
    }

    return this.apiClient
      .getWithParams<StoreBannerDto[]>('/api/store/banners', params)
      .pipe(
        catchError((error: unknown) => {
          console.error('[StorefrontApiService] Error getting banners:', error);
          throw error;
        })
      );
  }

  // ============================================
  // CATEGORÍAS
  // ============================================

  /**
   * Obtiene el árbol completo de categorías (incluye subcategorías)
   * GET /api/store/categories
   *
   * @param includeInactive - Incluir categorías inactivas (default: false)
   */
  getCategories(includeInactive = false): Observable<StoreCategoryDto[]> {
    const params: Record<string, boolean> = {};
    if (includeInactive) {
      params['includeInactive'] = true;
    }

    return this.apiClient
      .getWithParams<StoreCategoryDto[]>('/api/store/categories', params)
      .pipe(
        catchError((error: unknown) => {
          console.error(
            '[StorefrontApiService] Error getting categories:',
            error
          );
          throw error;
        })
      );
  }

  /**
   * Obtiene el detalle de una categoría específica por su slug
   * GET /api/store/categories/{slug}
   *
   * @param slug - URL slug de la categoría (ej: 'electronica')
   */
  getCategoryBySlug(slug: string): Observable<StoreCategoryDetailDto> {
    return this.apiClient
      .get<StoreCategoryDetailDto>(`/api/store/categories/${slug}`)
      .pipe(
        catchError((error: unknown) => {
          console.error(
            `[StorefrontApiService] Error getting category ${slug}:`,
            error
          );
          throw error;
        })
      );
  }

  // ============================================
  // PRODUCTOS
  // ============================================

  /**
   * Obtiene productos con filtros, búsqueda y paginación
   * GET /api/store/products
   *
   * Endpoint principal del catálogo. Soporta filtros combinados.
   *
   * @param filters - Objeto con todos los filtros disponibles
   */
  getProducts(filters?: ProductFilters): Observable<StoreProductListResponse> {
    const params: Record<string, string | number | boolean> = {};

    if (filters) {
      if (filters.category) params['category'] = filters.category;
      if (filters.search) params['search'] = filters.search;
      if (filters.minPrice !== undefined) params['minPrice'] = filters.minPrice;
      if (filters.maxPrice !== undefined) params['maxPrice'] = filters.maxPrice;
      if (filters.brand) params['brand'] = filters.brand;
      if (filters.featured !== undefined) params['featured'] = filters.featured;
      if (filters.inStock !== undefined) params['inStock'] = filters.inStock;
      if (filters.sortBy) params['sortBy'] = filters.sortBy;
      if (filters.sortOrder) params['sortOrder'] = filters.sortOrder;
      if (filters.page) params['page'] = filters.page;
      if (filters.pageSize) params['pageSize'] = filters.pageSize;
    }

    return this.apiClient
      .getWithParams<StoreProductListResponse>('/api/store/products', params)
      .pipe(
        catchError((error: unknown) => {
          console.error(
            '[StorefrontApiService] Error getting products:',
            error
          );
          throw error;
        })
      );
  }

  /**
   * Obtiene productos destacados para la homepage
   * GET /api/store/products/featured?limit={limit}
   *
   * @param limit - Cantidad de productos (default: 8, máx: 20)
   */
  getFeaturedProducts(limit = 8): Observable<StoreProductDto[]> {
    const params = { limit: Math.min(limit, 20) }; // Máximo 20

    return this.apiClient
      .getWithParams<StoreProductDto[]>('/api/store/products/featured', params)
      .pipe(
        catchError((error: unknown) => {
          console.error(
            '[StorefrontApiService] Error getting featured products:',
            error
          );
          throw error;
        })
      );
  }

  /**
   * Búsqueda typeahead/autocomplete para el buscador
   * GET /api/store/products/search?q={query}&limit={limit}
   *
   * Optimizada para respuestas rápidas.
   *
   * @param query - Texto de búsqueda (mínimo 2 caracteres)
   * @param limit - Cantidad de resultados (default: 10, máx: 20)
   */
  searchProducts(
    query: string,
    limit = 10
  ): Observable<StoreProductSearchResult[]> {
    if (query.length < 2) {
      console.warn(
        '[StorefrontApiService] Search query too short, minimum 2 characters'
      );
      return new Observable((observer) => {
        observer.next([]);
        observer.complete();
      });
    }

    const params = {
      q: query,
      limit: Math.min(limit, 20), // Máximo 20
    };

    return this.apiClient
      .getWithParams<StoreProductSearchResult[]>(
        '/api/store/products/search',
        params
      )
      .pipe(
        catchError((error: unknown) => {
          console.error(
            '[StorefrontApiService] Error searching products:',
            error
          );
          throw error;
        })
      );
  }

  /**
   * Obtiene el detalle completo de un producto por su slug
   * GET /api/store/products/{slug}
   *
   * Para la página de detalle del producto.
   *
   * @param slug - URL slug del producto (ej: 'samsung-galaxy-s24')
   */
  getProductBySlug(slug: string): Observable<StoreProductDetailDto> {
    return this.apiClient
      .get<StoreProductDetailDto>(`/api/store/products/${slug}`)
      .pipe(
        catchError((error: unknown) => {
          console.error(
            `[StorefrontApiService] Error getting product ${slug}:`,
            error
          );
          throw error;
        })
      );
  }

  // ============================================
  // UTILIDADES
  // ============================================

  /**
   * Obtiene productos relacionados de la misma categoría
   *
   * @param categorySlug - Slug de la categoría
   * @param limit - Cantidad de productos (default: 4)
   */
  getRelatedProducts(
    categorySlug: string,
    limit = 4
  ): Observable<StoreProductDto[]> {
    return this.getProducts({
      category: categorySlug,
      pageSize: limit,
      page: 1,
    }).pipe(map((response) => response.items));
  }

  /**
   * Obtiene productos de una categoría con paginación
   *
   * @param categorySlug - Slug de la categoría
   * @param page - Página actual
   * @param pageSize - Tamaño de página
   * @param additionalFilters - Filtros adicionales
   */
  getProductsByCategory(
    categorySlug: string,
    page = 1,
    pageSize = 20,
    additionalFilters?: Partial<ProductFilters>
  ): Observable<StoreProductListResponse> {
    return this.getProducts({
      category: categorySlug,
      page,
      pageSize,
      ...additionalFilters,
    });
  }
}
