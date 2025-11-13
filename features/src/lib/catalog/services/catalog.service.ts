import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiClientService, TenantContextService } from '@pwa/core';
import {
  Product,
  ProductSummary,
  CatalogFilters,
  ProductsResponse,
  CategoriesResponse,
  ProductResponse
} from '../models/catalog.models';

/**
 * Servicio de catálogo que utiliza ApiClientService
 * Los headers de tenant se añaden automáticamente vía TenantHeaderInterceptor
 */
@Injectable({
  providedIn: 'root'
})
export class CatalogService {
  private readonly apiClient = inject(ApiClientService);
  private readonly tenantContext = inject(TenantContextService);

  /**
   * Obtiene la lista paginada de productos
   */
  getProducts(
    page = 1,
    pageSize = 20,
    filters?: CatalogFilters
  ): Observable<ProductsResponse> {
    const params: Record<string, string | number | boolean> = {
      page,
      pageSize
    };

    // Aplicar filtros si existen
    if (filters) {
      if (filters.categoryId) params['categoryId'] = filters.categoryId;
      if (filters.search) params['search'] = filters.search;
      if (filters.minPrice !== undefined) params['minPrice'] = filters.minPrice;
      if (filters.maxPrice !== undefined) params['maxPrice'] = filters.maxPrice;
      if (filters.inStock !== undefined) params['inStock'] = filters.inStock;
      if (filters.tags && filters.tags.length > 0) {
        params['tags'] = filters.tags.join(',');
      }
    }

    return this.apiClient.getWithParams<ProductsResponse>(
      '/api/catalog/products',
      params
    );
  }

  /**
   * Obtiene un producto específico por ID
   */
  getProduct(productId: string): Observable<ProductResponse> {
    return this.apiClient.get<ProductResponse>(`/api/catalog/products/${productId}`);
  }

  /**
   * Obtiene las categorías disponibles
   */
  getCategories(includeProductCount = false): Observable<CategoriesResponse> {
    const params: Record<string, boolean> = {};
    if (includeProductCount) {
      params['includeProductCount'] = true;
    }

    return this.apiClient.getWithParams<CategoriesResponse>(
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
    filters?: Omit<CatalogFilters, 'search'>
  ): Observable<ProductsResponse> {
    return this.getProducts(page, pageSize, { ...filters, search: query });
  }

  /**
   * Obtiene productos destacados
   */
  getFeaturedProducts(limit = 12): Observable<ProductsResponse> {
    return this.apiClient.getWithParams<ProductsResponse>(
      '/api/catalog/products/featured',
      { limit }
    );
  }

  /**
   * Obtiene productos de una categoría específica
   */
  getProductsByCategory(
    categoryId: string,
    page = 1,
    pageSize = 20,
    filters?: Omit<CatalogFilters, 'categoryId'>
  ): Observable<ProductsResponse> {
    return this.getProducts(page, pageSize, { ...filters, categoryId });
  }

  /**
   * Obtiene productos relacionados
   */
  getRelatedProducts(productId: string, limit = 6): Observable<ProductsResponse> {
    return this.apiClient.getWithParams<ProductsResponse>(
      `/api/catalog/products/${productId}/related`,
      { limit }
    );
  }

  // === UTILIDADES ===

  /**
   * Construye URLs de imágenes usando el CDN del tenant
   */
  buildImageUrl(imagePath: string): string {
    const config = this.tenantContext.getCurrentTenantConfig();

    if (!config?.cdnBaseUrl) {
      return imagePath;
    }

    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      return imagePath;
    }

    const cdnBase = config.cdnBaseUrl.endsWith('/')
      ? config.cdnBaseUrl
      : `${config.cdnBaseUrl}/`;

    const cleanPath = imagePath.startsWith('/') ? imagePath.substring(1) : imagePath;

    return `${cdnBase}${cleanPath}`;
  }

  /**
   * Formatea el precio según la configuración del tenant
   */
  formatPrice(price: number): string {
    const config = this.tenantContext.getCurrentTenantConfig();
    const currency = config?.currency ?? 'USD';
    const locale = config?.locale ?? 'en-US';

    try {
      return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: currency
      }).format(price);
    } catch {
      // Fallback si hay error con la configuración de locale/currency
      return `${currency} ${price.toLocaleString()}`;
    }
  }

  /**
   * Verifica si el stock está disponible
   */
  isInStock(product: ProductSummary | Product): boolean {
    return product.stock !== undefined && product.stock > 0;
  }

  /**
   * Obtiene información del tenant actual
   */
  getCurrentTenantInfo() {
    const config = this.tenantContext.getCurrentTenantConfig();
    if (!config) return null;

    return {
      id: config.tenant.id,
      slug: config.tenant.slug,
      displayName: config.tenant.displayName,
      currency: config.currency,
      locale: config.locale,
      cdnBaseUrl: config.cdnBaseUrl,
      primaryColor: config.theme.primary,
      accentColor: config.theme.accent
    };
  }
}
