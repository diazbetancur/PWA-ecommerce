import { Injectable, inject } from '@angular/core';
import { ApiClientService } from '@pwa/core';
import { Observable } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import {
  CatalogFilters,
  CategoriesResponse,
  Category,
  CategoryDto,
  PaginatedResponseDto,
  Product,
  ProductDto,
  ProductResponse,
  ProductSummary,
  ProductSummaryDto,
  ProductsResponse,
} from '../models/catalog-dto.models';

/**
 * 🌐 CatalogService - Consumo del Backend Real de Azure
 * ✅ ALINEADO CON API DOCUMENTATION v1
 *
 * Este servicio consume el backend real usando ApiClientService.
 * NO hardcodea URLs, solo usa paths relativos.
 *
 * Backend URL: https://api-ecommerce-d9fxeccbeeehdjd3.eastus-01.azurewebsites.net
 *
 * Endpoints implementados:
 * - GET /api/catalog/products              → Lista paginada de productos
 * - GET /api/catalog/products/{id}         → Detalle de un producto
 * - GET /api/catalog/categories            → Array de categorías activas
 *
 * 📝 Headers automáticos (vía TenantHeaderInterceptor):
 * - X-Tenant-Slug: {slug} (required)
 *
 * Query Parameters soportados en /api/catalog/products:
 * - page (integer): Page number (1-based)
 * - pageSize (integer): Items per page (max 100)
 * - search (string): Search in product names
 * - categoryId (UUID): Filter by category
 * - minPrice (decimal): Minimum price filter
 * - maxPrice (decimal): Maximum price filter
 *
 * ⚠️ IMPORTANTE: Si la estructura del backend cambia, ajusta:
 * 1. Los DTOs en catalog-dto.models.ts
 * 2. Los métodos mapper (mapProductDto, mapProductSummaryDto, etc.)
 */
@Injectable({
  providedIn: 'root',
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
      pageSize,
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
          console.error(
            '❌ [CatalogService] Error al obtener productos:',
            error
          );
          throw error;
        })
      );
  }

  /**
   * 🔍 Obtiene un producto específico por ID
   * ✅ ALINEADO CON API DOCUMENTATION v1
   *
   * Endpoint: GET /api/catalog/products/{id}
   *
   * La API devuelve directamente ProductDto (no un wrapper):
   * {
   *   "id": "uuid",
   *   "name": "Wireless Headphones",
   *   "price": 299.99,
   *   "discount": 0.15,
   *   "finalPrice": 254.99,
   *   ...
   * }
   *
   * @param productId ID del producto (UUID)
   * @returns Observable con el producto completo
   *
   * 🔧 Ejemplo de uso:
   * ```typescript
   * catalogService.getProduct('3fa85f64-5717-4562-b3fc-2c963f66afa6')
   *   .subscribe(response => {
   *     console.log('Producto:', response.data);
   *   });
   * ```
   */
  getProduct(productId: string): Observable<ProductResponse> {
    // La API devuelve ProductDto directamente, no un wrapper
    return this.apiClient
      .get<ProductDto>(`/api/catalog/products/${productId}`)
      .pipe(
        map((dto: ProductDto) => ({
          data: this.mapProductDto(dto),
          success: true,
        })),
        catchError((error: unknown) => {
          console.error(
            `❌ [CatalogService] Error al obtener producto ${productId}:`,
            error
          );
          throw error;
        })
      );
  }

  /**
   * 📂 Obtiene las categorías disponibles
   * ✅ ALINEADO CON API DOCUMENTATION v1
   *
   * Endpoint: GET /api/catalog/categories
   *
   * La API devuelve un array directo (no paginado):
   * [
   *   { "id": "uuid", "name": "Electronics", "description": "...", "productCount": 45 },
   *   ...
   * ]
   *
   * @returns Observable con las categorías
   */
  getCategories(): Observable<CategoriesResponse> {
    return this.apiClient.get<CategoryDto[]>('/api/catalog/categories').pipe(
      map((response: CategoryDto[]) =>
        this.mapPaginatedCategoriesResponse(response, this.mapCategoryDto)
      ),
      catchError((error: unknown) => {
        console.error(
          '❌ [CatalogService] Error al obtener categorías:',
          error
        );
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
          console.error(
            '❌ [CatalogService] Error al obtener productos destacados:',
            error
          );
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
   * ✅ ALINEADO CON API DOCUMENTATION v1
   *
   * El backend devuelve:
   * - discount: decimal (0.00 - 1.00)
   * - finalPrice: precio con descuento aplicado
   * - isActive: boolean
   * - images: array (no imageUrl)
   * - categories: array de CategorySummaryDto
   * - dynamicAttributes: key-value pairs
   */
  private mapProductDto(dto: ProductDto): Product {
    return {
      id: dto.id,
      name: dto.name,
      description: dto.description,
      price: dto.price,
      discount: dto.discount, // 0.15 = 15% discount
      finalPrice: dto.finalPrice, // price * (1 - discount)
      imageUrl: dto.images[0] || '', // Usar primera imagen como principal
      images: dto.images,
      stock: dto.stock,
      active: dto.isActive, // Backend usa isActive
      // Mapear categorías (tomar primera categoría para categoryId/categoryName)
      categoryId: dto.categories[0]?.id || '',
      categoryName: dto.categories[0]?.name || '',
      categories: dto.categories, // Mantener array completo
      // Extraer campos de dynamicAttributes
      sku: dto.dynamicAttributes?.['sku'] as string,
      tags: dto.dynamicAttributes?.['tags'] as string[],
      weight: dto.dynamicAttributes?.['weight'] as number,
      dimensions: dto.dynamicAttributes?.['dimensions'] as {
        length: number;
        width: number;
        height: number;
      },
      // Mantener dynamicAttributes completo para acceso flexible
      dynamicAttributes: dto.dynamicAttributes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  /**
   * Mapea ProductSummaryDto (backend) → ProductSummary (frontend)
   * ✅ ALINEADO CON API DOCUMENTATION v1
   *
   * Nota: La API devuelve ProductDto completo en listados,
   * no una versión simplificada. ProductSummaryDto = ProductDto.
   */
  private mapProductSummaryDto(dto: ProductSummaryDto): ProductSummary {
    return {
      id: dto.id,
      name: dto.name,
      price: dto.price,
      discount: dto.discount,
      finalPrice: dto.finalPrice,
      imageUrl: dto.images[0] || '', // Primera imagen
      sku: dto.dynamicAttributes?.['sku'] as string,
      stock: dto.stock,
      active: dto.isActive, // Backend usa isActive
    };
  }

  /**
   * Mapea CategoryDto (backend) → Category (frontend)
   * ✅ ALINEADO CON API DOCUMENTATION v1
   *
   * El backend devuelve:
   * - productCount (no productsCount)
   * - description (required, no optional)
   */
  private mapCategoryDto(dto: CategoryDto): Category {
    return {
      id: dto.id,
      name: dto.name,
      description: dto.description,
      imageUrl: '', // Backend no devuelve imageUrl por ahora
      parentId: '', // Backend no devuelve parentId por ahora
      sortOrder: 0, // Backend no devuelve sortOrder por ahora
      active: true, // Asumir activo (backend no devuelve isActive)
      productsCount: dto.productCount, // Backend usa productCount (no productsCount)
    };
  }

  /**
   * Mapea respuesta paginada de productos del backend a formato interno
   * ✅ ALINEADO CON API DOCUMENTATION v1
   *
   * La API devuelve: { items, totalCount, page, pageSize, totalPages }
   */
  private mapPaginatedProductsResponse(
    response: PaginatedResponseDto<ProductSummaryDto>,
    mapper: (dto: ProductSummaryDto) => ProductSummary
  ): ProductsResponse {
    const mappedData = response.items.map(mapper.bind(this));
    return {
      success: true,
      data: mappedData,
      total: response.totalCount,
      page: response.page,
      pageSize: response.pageSize,
      totalPages: response.totalPages,
    };
  }

  /**
   * Mapea respuesta paginada de categorías del backend a formato interno
   * ✅ ALINEADO CON API DOCUMENTATION v1
   *
   * Nota: Categories endpoint devuelve array directo, no paginado según documentación
   * Pero mantenemos estructura paginada por consistencia
   */
  private mapPaginatedCategoriesResponse(
    response: PaginatedResponseDto<CategoryDto> | CategoryDto[],
    mapper: (dto: CategoryDto) => Category
  ): CategoriesResponse {
    // Manejar respuesta como array o paginada
    if (Array.isArray(response)) {
      const mappedCategories = response.map(mapper.bind(this));
      return {
        success: true,
        data: mappedCategories,
        total: response.length,
        page: 1,
        pageSize: response.length,
        totalPages: 1,
      };
    }

    const mappedCategories = response.items.map(mapper.bind(this));
    return {
      success: true,
      data: mappedCategories,
      total: response.totalCount,
      page: response.page,
      pageSize: response.pageSize,
      totalPages: response.totalPages,
    };
  }

  /**
   * 🖼️ Construye la URL completa de una imagen de producto
   *
   * @param imageUrl URL relativa o completa de la imagen
   * @returns URL completa de la imagen
   */
  buildImageUrl(imageUrl: string | undefined): string {
    if (!imageUrl) {
      return '/assets/images/no-image.png';
    }
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
      return imageUrl;
    }
    // Si es relativa, simplemente retornar la ruta
    return imageUrl;
  }

  /**
   * 💰 Formatea un precio con el símbolo de moneda del tenant actual
   *
   * @param price Precio a formatear
   * @returns Precio formateado (ej: "$29.99")
   */
  formatPrice(price: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
    }).format(price);
  }

  /**
   * 📦 Verifica si un producto está en stock
   *
   * @param stock Cantidad en stock
   * @returns true si hay stock disponible
   */
  isInStock(stock: number): boolean {
    return stock > 0;
  }
}
