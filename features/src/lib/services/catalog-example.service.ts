import { Injectable, inject, signal } from '@angular/core';
import { Observable, map, tap } from 'rxjs';
import { ApiClientService } from '@core/services/api-client.service';

/**
 * Interfaces para tipado fuerte
 */
export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl?: string;
  categoryId: string;
  tags: string[];
  inStock: boolean;
  slug: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  productCount: number;
}

export interface ProductFilters {
  q?: string;           // Search query
  categoryId?: string;  // Filter by category
  minPrice?: number;    // Minimum price
  maxPrice?: number;    // Maximum price
  inStock?: boolean;    // Only in-stock products
  tags?: string[];      // Filter by tags
  page?: number;        // Page number (1-based)
  limit?: number;       // Items per page
  sortBy?: 'name' | 'price' | 'created' | 'popularity';
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Servicio de catálogo que demuestra el uso correcto del ApiClientService
 * - Usa solo paths relativos
 * - Tipos fuertemente tipados
 * - Manejo de errores integrado
 * - Signals para estado reactivo
 */
@Injectable({
  providedIn: 'root'
})
export class CatalogService {
  private readonly apiClient = inject(ApiClientService);

  // Signals para estado reactivo
  readonly isLoading = signal(false);
  readonly error = signal<string | null>(null);

  // ============================================================================
  // MÉTODOS DE PRODUCTOS
  // ============================================================================

  /**
   * Obtiene productos con filtros opcionales
   * @param filters - Filtros de búsqueda y paginación
   * @returns Observable con productos paginados
   */
  getProducts(filters: ProductFilters = {}): Observable<PaginatedResponse<Product>> {
    this.isLoading.set(true);
    this.error.set(null);

    return this.apiClient.getWithParams<PaginatedResponse<Product>>(
      '/api/catalog/products',
      this.buildProductParams(filters),
      {},
      { enableLogging: true }
    ).pipe(
      tap(() => this.isLoading.set(false)),
      tap({
        error: (err) => {
          this.isLoading.set(false);
          this.error.set(this.getErrorMessage(err));
        }
      })
    );
  }

  /**
   * Obtiene un producto por su ID
   * @param productId - ID del producto
   * @returns Observable con el producto
   */
  getProductById(productId: string): Observable<Product> {
    return this.apiClient.get<Product>(`/api/catalog/products/${productId}`, {}, {
      enableLogging: true,
      timeout: 10000
    });
  }

  /**
   * Obtiene un producto por su slug
   * @param slug - Slug del producto
   * @returns Observable con el producto
   */
  getProductBySlug(slug: string): Observable<Product> {
    return this.apiClient.getWithParams<Product>(
      '/api/catalog/products/by-slug',
      { slug }
    );
  }

  /**
   * Busca productos con texto libre
   * @param query - Término de búsqueda
   * @param limit - Número máximo de resultados
   * @returns Observable con productos encontrados
   */
  searchProducts(query: string, limit = 10): Observable<Product[]> {
    if (!query.trim()) {
      return new Observable(subscriber => subscriber.next([]));
    }

    return this.apiClient.getWithParams<PaginatedResponse<Product>>(
      '/api/catalog/products/search',
      { q: query.trim(), limit }
    ).pipe(
      map(response => response.items)
    );
  }

  // ============================================================================
  // MÉTODOS DE CATEGORÍAS
  // ============================================================================

  /**
   * Obtiene todas las categorías
   * @returns Observable con lista de categorías
   */
  getCategories(): Observable<Category[]> {
    return this.apiClient.get<Category[]>('/api/catalog/categories');
  }

  /**
   * Obtiene una categoría por ID
   * @param categoryId - ID de la categoría
   * @returns Observable con la categoría
   */
  getCategoryById(categoryId: string): Observable<Category> {
    return this.apiClient.get<Category>(`/api/catalog/categories/${categoryId}`);
  }

  /**
   * Obtiene productos de una categoría específica
   * @param categoryId - ID de la categoría
   * @param filters - Filtros adicionales
   * @returns Observable con productos de la categoría
   */
  getProductsByCategory(
    categoryId: string,
    filters: Omit<ProductFilters, 'categoryId'> = {}
  ): Observable<PaginatedResponse<Product>> {
    return this.getProducts({ ...filters, categoryId });
  }

  // ============================================================================
  // MÉTODOS DE UTILIDAD Y TRANSFORMACIÓN
  // ============================================================================

  /**
   * Convierte filtros a parámetros de query
   * @param filters - Filtros del producto
   * @returns Objeto con parámetros para la API
   */
  private buildProductParams(filters: ProductFilters): Record<string, string | number | boolean> {
    const params: Record<string, string | number | boolean> = {};

    // Parámetros de búsqueda
    if (filters.q) params.q = filters.q;
    if (filters.categoryId) params.categoryId = filters.categoryId;

    // Parámetros de precio
    if (filters.minPrice !== undefined) params.minPrice = filters.minPrice;
    if (filters.maxPrice !== undefined) params.maxPrice = filters.maxPrice;

    // Filtros booleanos
    if (filters.inStock !== undefined) params.inStock = filters.inStock;

    // Tags (convertir array a string)
    if (filters.tags && filters.tags.length > 0) {
      params.tags = filters.tags.join(',');
    }

    // Paginación
    params.page = filters.page || 1;
    params.limit = filters.limit || 20;

    // Ordenamiento
    if (filters.sortBy) params.sortBy = filters.sortBy;
    if (filters.sortOrder) params.sortOrder = filters.sortOrder;

    return params;
  }

  /**
   * Extrae mensaje de error amigable
   * @param error - Error de la API
   * @returns Mensaje de error legible
   */
  private getErrorMessage(error: unknown): string {
    if (error && typeof error === 'object' && 'message' in error) {
      return (error as { message: string }).message;
    }

    if (error && typeof error === 'object' && 'error' in error) {
      const apiError = error as { error: { message?: string } };
      return apiError.error.message || 'Error desconocido';
    }

    return 'Error al cargar productos';
  }

  // ============================================================================
  // MÉTODOS DE CONVENIENCIA PARA CASOS COMUNES
  // ============================================================================

  /**
   * Obtiene productos destacados/populares
   * @param limit - Número de productos a obtener
   * @returns Observable con productos destacados
   */
  getFeaturedProducts(limit = 8): Observable<Product[]> {
    return this.apiClient.getWithParams<PaginatedResponse<Product>>(
      '/api/catalog/products/featured',
      { limit }
    ).pipe(
      map(response => response.items)
    );
  }

  /**
   * Obtiene productos relacionados
   * @param productId - ID del producto de referencia
   * @param limit - Número de productos relacionados
   * @returns Observable con productos relacionados
   */
  getRelatedProducts(productId: string, limit = 4): Observable<Product[]> {
    return this.apiClient.getWithParams<Product[]>(
      `/api/catalog/products/${productId}/related`,
      { limit }
    );
  }

  /**
   * Obtiene productos recién agregados
   * @param limit - Número de productos a obtener
   * @returns Observable con productos nuevos
   */
  getNewProducts(limit = 12): Observable<Product[]> {
    return this.getProducts({
      sortBy: 'created',
      sortOrder: 'desc',
      limit
    }).pipe(
      map(response => response.items)
    );
  }

  /**
   * Obtiene estadísticas del catálogo
   * @returns Observable con estadísticas generales
   */
  getCatalogStats(): Observable<{
    totalProducts: number;
    totalCategories: number;
    inStockProducts: number;
    outOfStockProducts: number;
  }> {
    return this.apiClient.get<{
      totalProducts: number;
      totalCategories: number;
      inStockProducts: number;
      outOfStockProducts: number;
    }>('/api/catalog/stats');
  }

  // ============================================================================
  // MÉTODOS DE DEMOSTRACIÓN AVANZADA
  // ============================================================================

  /**
   * Ejemplo de uso del método admin() del ApiClientService
   * Solo disponible para usuarios con permisos de administrador
   */
  getProductsAsAdmin(): Observable<Product[]> {
    // Usa el método de conveniencia admin() del ApiClientService
    return this.apiClient.admin<PaginatedResponse<Product>>(
      'products',
      'GET',
      undefined,
      { includeDrafts: true, includeArchived: true }
    ).pipe(
      map(response => response.items)
    );
  }

  /**
   * Ejemplo de uso del método getCatalog() del ApiClientService
   */
  getProductsUsingCatalogMethod(): Observable<Product[]> {
    return this.apiClient.getCatalog<PaginatedResponse<Product>>(
      'products',
      { limit: 50, sortBy: 'name' }
    ).pipe(
      map(response => response.items)
    );
  }

  /**
   * Ejemplo de request con timeout personalizado
   */
  getProductsWithCustomTimeout(): Observable<Product[]> {
    return this.apiClient.withTimeout<PaginatedResponse<Product>>(
      '/api/catalog/products',
      'GET',
      undefined,
      15000 // 15 segundos de timeout
    ).pipe(
      map(response => response.items)
    );
  }

  /**
   * Ejemplo de health check del catálogo
   */
  checkCatalogHealth(): Observable<{ status: string; products: number; categories: number }> {
    return this.apiClient.get<{ status: string; products: number; categories: number }>(
      '/api/catalog/health'
    );
  }
}
