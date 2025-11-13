import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { ApiClientService } from '@pwa/core';
import {
  ProductDto,
  ProductSummaryDto,
  CategoryDto,
  PaginatedResponseDto,
  SingleResponseDto,
  Product,
  ProductSummary,
  Category,
  CatalogFilters,
  ProductsResponse,
  CategoriesResponse,
  ProductResponse
} from '../models/catalog-dto.models';

/**
 * 🌐 CatalogService - Consumo del Backend Real de Azure
 *
 * Este servicio consume el backend real usando ApiClientService.
 * NO hardcodea URLs, solo usa paths relativos.
 *
 * Backend URL: https://api-ecommerce-d9fxeccbeeehdjd3.eastus-01.azurewebsites.net
 *
 * Endpoints:
 * - GET /api/catalog/products              → Lista paginada de productos
 * - GET /api/catalog/products/{id}         → Detalle de un producto
 * - GET /api/catalog/categories            → Lista de categorías
 * - GET /api/catalog/products/featured     → Productos destacados
 *
 * 📝 Headers automáticos (vía TenantHeaderInterceptor):
 * - X-Tenant-Slug: {slug}
 * - X-Tenant-Key: {uuid}
 *
 * ⚠️ IMPORTANTE: Si la estructura del backend cambia, ajusta:
 * 1. Los DTOs en catalog-dto.models.ts
 * 2. Los métodos mapper (mapProductDto, mapProductSummaryDto, etc.)
 */
@Injectable({
  providedIn: 'root'
})
export class CatalogService {
  private readonly apiClient = inject(ApiClientService);

  /**
   * 📦 Obtiene la lista paginada de productos del backend
   *
   * Endpoint: GET /api/catalog/products?page=1&pageSize=20&categoryId=...
   *
   * @param page Número de página (base 1)
   * @param pageSize Cantidad de productos por página
   * @param filters Filtros opcionales (categoría, búsqueda, precio, stock)
   * @returns Observable con la respuesta paginada
   *
   * 🔧 Ejemplo de uso:
   * ```typescript
   * catalogService.getProducts(1, 20, { categoryId: 'electronics' })
   *   .subscribe(response => {
   *     console.log('Productos:', response.data);
   *     console.log('Total:', response.totalCount);
   *   });
   * ```
   */
  getProducts(
    page = 1,
    pageSize = 20,
    filters?: CatalogFilters
  ): Observable<ProductsResponse> {
    // Construir parámetros de query
    const params: Record<string, string | number | boolean> = {
      page,
      pageSize
    };

    // Agregar filtros si existen
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

    // Llamar al backend usando ApiClientService
    // La URL completa se construye automáticamente:
    // https://api-ecommerce-d9fxeccbeeehdjd3.eastus-01.azurewebsites.net/api/catalog/products
    return this.apiClient
      .getWithParams<PaginatedResponseDto<ProductSummaryDto>>(
        '/api/catalog/products',
        params
      )
      .pipe(
        map((response: PaginatedResponseDto<ProductSummaryDto>) =>
          this.mapPaginatedProductsResponse(response, this.mapProductSummaryDto)
        ),
        catchError((error: unknown) => {
          console.error('❌ [CatalogService] Error al obtener productos:', error);
          throw error;
        })
      );
  }

  /**
   * 🔍 Obtiene un producto específico por ID
   *
   * Endpoint: GET /api/catalog/products/{id}
   *
   * @param productId ID del producto
   * @returns Observable con el producto completo
   *
   * 🔧 Ejemplo de uso:
   * ```typescript
   * catalogService.getProduct('product-123')
   *   .subscribe(response => {
   *     console.log('Producto:', response.data);
   *   });
   * ```
   */
  getProduct(productId: string): Observable<ProductResponse> {
    // ⚠️ NOTA: Asume que el backend devuelve { data: ProductDto }
    // Si tu backend devuelve el producto directamente sin wrapper,
    // cambia SingleResponseDto<ProductDto> por ProductDto
    return this.apiClient
      .get<SingleResponseDto<ProductDto>>(`/api/catalog/products/${productId}`)
      .pipe(
        map((response: SingleResponseDto<ProductDto>) => ({
          data: this.mapProductDto(response.data),
          success: response.success ?? true,
          message: response.message
        })),
        catchError((error: unknown) => {
          console.error(`❌ [CatalogService] Error al obtener producto ${productId}:`, error);
          throw error;
        })
      );
  }

  /**
   * 📂 Obtiene las categorías disponibles
   *
   * Endpoint: GET /api/catalog/categories?includeProductCount=true
   *
   * @param includeProductCount Si debe incluir el conteo de productos por categoría
   * @returns Observable con las categorías
   */
  getCategories(includeProductCount = false): Observable<CategoriesResponse> {
    const params: Record<string, boolean> = {};
    if (includeProductCount) {
      params['includeProductCount'] = true;
    }

    return this.apiClient
      .getWithParams<PaginatedResponseDto<CategoryDto>>(
        '/api/catalog/categories',
        params
      )
      .pipe(
        map((response: PaginatedResponseDto<CategoryDto>) =>
          this.mapPaginatedCategoriesResponse(response, this.mapCategoryDto)
        ),
        catchError((error: unknown) => {
          console.error('❌ [CatalogService] Error al obtener categorías:', error);
          throw error;
        })
      );
  }

  /**
   * 🔎 Busca productos por texto
   *
   * @param query Texto de búsqueda
   * @param page Número de página
   * @param pageSize Cantidad por página
   * @param filters Filtros adicionales
   * @returns Observable con los resultados de búsqueda
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
   * ⭐ Obtiene productos destacados
   *
   * Endpoint: GET /api/catalog/products/featured?limit=12
   *
   * @param limit Cantidad máxima de productos
   * @returns Observable con productos destacados
   *
   * ⚠️ NOTA: Si tu backend no tiene este endpoint, elimina este método
   * o adáptalo a usar un filtro como isFeatured=true
   */
  getFeaturedProducts(limit = 12): Observable<ProductsResponse> {
    return this.apiClient
      .getWithParams<PaginatedResponseDto<ProductSummaryDto>>(
        '/api/catalog/products/featured',
        { limit }
      )
      .pipe(
        map((response: PaginatedResponseDto<ProductSummaryDto>) =>
          this.mapPaginatedProductsResponse(response, this.mapProductSummaryDto)
        ),
        catchError((error: unknown) => {
          console.error('❌ [CatalogService] Error al obtener productos destacados:', error);
          throw error;
        })
      );
  }

  /**
   * 📦 Obtiene productos de una categoría específica
   *
   * @param categoryId ID de la categoría
   * @param page Número de página
   * @param pageSize Cantidad por página
   * @returns Observable con productos de la categoría
   */
  getProductsByCategory(
    categoryId: string,
    page = 1,
    pageSize = 20,
    filters?: Omit<CatalogFilters, 'categoryId'>
  ): Observable<ProductsResponse> {
    return this.getProducts(page, pageSize, { ...filters, categoryId });
  }

  // ============================================================================
  // 🔄 MAPPERS: Convierte DTOs del backend a modelos internos
  // ============================================================================
  // ⚠️ Si la estructura del backend cambia, ajusta estos métodos

  /**
   * Mapea ProductDto (backend) → Product (frontend)
   */
  private mapProductDto(dto: ProductDto): Product {
    return {
      id: dto.id,
      name: dto.name,
      description: dto.description ?? '',
      price: dto.price,
      imageUrl: dto.imageUrl ?? '',
      images: dto.images,
      sku: dto.sku,
      stock: dto.stock,
      active: dto.active,
      categoryId: dto.categoryId,
      categoryName: dto.categoryName,
      tags: dto.tags,
      weight: dto.weight,
      dimensions: dto.dimensions,
      createdAt: dto.createdAt || new Date().toISOString(),
      updatedAt: dto.updatedAt || new Date().toISOString()
    };
  }

  /**
   * Mapea ProductSummaryDto (backend) → ProductSummary (frontend)
   */
  private mapProductSummaryDto(dto: ProductSummaryDto): ProductSummary {
    return {
      id: dto.id,
      name: dto.name,
      price: dto.price,
      imageUrl: dto.imageUrl ?? '',
      sku: dto.sku,
      stock: dto.stock,
      active: dto.active
    };
  }

  /**
   * Mapea CategoryDto (backend) → Category (frontend)
   */
  private mapCategoryDto(dto: CategoryDto): Category {
    return {
      id: dto.id,
      name: dto.name,
      description: dto.description,
      imageUrl: dto.imageUrl,
      parentId: dto.parentId,
      sortOrder: dto.sortOrder,
      active: dto.active,
      productsCount: dto.productsCount
    };
  }

  /**
   * Mapea respuesta paginada de productos del backend a formato interno
   *
   * ⚠️ AJUSTAR según la estructura real del backend:
   * Si tu backend usa "data" en lugar de "items", cambiar response.items por response.data
   */
  private mapPaginatedProductsResponse(
    response: PaginatedResponseDto<ProductSummaryDto>,
    mapper: (dto: ProductSummaryDto) => ProductSummary
  ): ProductsResponse {
    return {
      success: true,
      data: response.items.map(mapper.bind(this)),  // 🔧 Si usa "data", cambiar a response.data
      total: response.totalCount,
      page: response.page,
      pageSize: response.pageSize,
      totalPages: response.totalPages
    };
  }

  /**
   * Mapea respuesta paginada de categorías del backend a formato interno
   */
  private mapPaginatedCategoriesResponse(
    response: PaginatedResponseDto<CategoryDto>,
    mapper: (dto: CategoryDto) => Category
  ): CategoriesResponse {
    return {
      success: true,
      data: response.items.map(mapper.bind(this)),  // 🔧 Si usa "data", cambiar a response.data
      total: response.totalCount,
      page: response.page,
      pageSize: response.pageSize,
      totalPages: response.totalPages
    };
  }
}

/**
 * 📝 NOTAS DE ADAPTACIÓN DEL SERVICIO:
 *
 * 1. **Si el backend devuelve estructura diferente en la paginación:**
 *    ```typescript
 *    // Ejemplo 1: Backend usa "data" en lugar of "items"
 *    data: response.data.map(mapper.bind(this))
 *
 *    // Ejemplo 2: Backend usa estructura anidada
 *    data: response.pagination.results.map(mapper.bind(this)),
 *    page: response.pagination.currentPage,
 *    total: response.pagination.totalItems
 *    ```
 *
 * 2. **Si el backend devuelve producto sin wrapper:**
 *    En getProduct(), cambiar:
 *    ```typescript
 *    .get<ProductDto>(`/api/catalog/products/${productId}`)
 *    .pipe(map(dto => ({ data: this.mapProductDto(dto), success: true })))
 *    ```
 *
 * 3. **Si necesitas agregar campos al mapeo:**
 *    Edita los métodos mapProductDto, mapProductSummaryDto, mapCategoryDto
 *
 * 4. **Logging para debugging:**
 *    ```typescript
 *    import { tap } from 'rxjs/operators';
 *    ...
 *    .pipe(
 *      tap(response => console.log('📦 Backend response:', response)),
 *      map(response => this.mapPaginatedProductsResponse(...))
 *    )
 *    ```
 */

/**
 * 📝 NOTAS DE ADAPTACIÓN:
 *
 * 1. **Si el backend devuelve estructura diferente en la paginación:**
 *    ```typescript
 *    // Ejemplo 1: Backend usa "data" en lugar de "items"
 *    data: response.data.map(mapper.bind(this))
 *
 *    // Ejemplo 2: Backend usa estructura anidada
 *    data: response.pagination.results.map(mapper.bind(this)),
 *    page: response.pagination.currentPage,
 *    totalCount: response.pagination.totalItems
 *    ```
 *
 * 2. **Si el backend devuelve producto sin wrapper:**
 *    En getProduct(), cambiar:
 *    ```typescript
 *    .get<ProductDto>(`/api/catalog/products/${productId}`)
 *    .pipe(map(dto => ({ data: this.mapProductDto(dto), success: true })))
 *    ```
 *
 * 3. **Si necesitas agregar campos al mapeo:**
 *    ```typescript
 *    private mapProductDto(dto: ProductDto): Product {
 *      return {
 *        // ... campos existentes
 *        discount: dto.discount,
 *        discountedPrice: dto.discountedPrice,
 *        rating: dto.rating,
 *        // etc.
 *      };
 *    }
 *    ```
 *
 * 4. **Si el backend usa nombres diferentes:**
 *    ```typescript
 *    price: dto.unitPrice,  // Si el campo se llama unitPrice
 *    stock: dto.quantity,   // Si el campo se llama quantity
 *    imageUrl: dto.mainImage || dto.thumbnailUrl,  // Prioridad/fallback
 *    ```
 *
 * 5. **Logging para debugging:**
 *    Descomenta las líneas de console.log para ver qué devuelve el backend:
 *    ```typescript
 *    .pipe(
 *      tap(response => console.log('Backend response:', response)),
 *      map(response => this.mapPaginatedResponse(...))
 *    )
 *    ```
 */
