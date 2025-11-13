/**
 * 🔷 DTOs del Backend Real de Azure
 *
 * Estos son los tipos que el backend .NET devuelve.
 * Si la estructura real del backend es diferente, ajusta estos tipos aquí.
 */

/**
 * DTO de Producto que viene del backend
 * Endpoint: GET /api/catalog/products
 *
 * 📝 NOTA: Si tu backend devuelve campos diferentes, ajusta esta interfaz.
 * Campos comunes que podrías necesitar agregar/quitar:
 * - discount, discountedPrice (para productos en oferta)
 * - rating, reviewsCount (para calificaciones)
 * - brand, manufacturer (para marca/fabricante)
 * - attributes (variantes: color, talla, etc.)
 */
export interface ProductDto {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  images?: string[];          // URLs adicionales de imágenes
  sku?: string;               // SKU del producto
  stock?: number;             // Cantidad disponible
  active: boolean;            // Si está activo/visible
  categoryId?: string;
  categoryName?: string;
  tags?: string[];            // Tags/etiquetas
  weight?: number;            // Peso en gramos/kg
  dimensions?: {
    length: number;
    width: number;
    height: number;
  };
  createdAt?: string;         // ISO 8601 date
  updatedAt?: string;         // ISO 8601 date

  // 🔧 Campos opcionales que tu backend podría tener:
  // discount?: number;
  // discountedPrice?: number;
  // rating?: number;
  // reviewsCount?: number;
  // brand?: string;
  // manufacturer?: string;
  // isNew?: boolean;
  // isFeatured?: boolean;
  // metadata?: Record<string, any>;
}

/**
 * DTO simplificado de producto (para listados)
 * Si tu backend devuelve un objeto completo en lugar de uno simplificado,
 * puedes usar ProductDto directamente
 */
export interface ProductSummaryDto {
  id: string;
  name: string;
  price: number;
  imageUrl: string;
  sku?: string;
  stock?: number;
  active: boolean;
  categoryName?: string;

  // 🔧 Campos adicionales comunes:
  // discount?: number;
  // rating?: number;
}

/**
 * DTO de Categoría del backend
 */
export interface CategoryDto {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  parentId?: string;
  sortOrder?: number;
  active: boolean;
  productsCount?: number;
}

/**
 * Respuesta paginada del backend
 *
 * 📝 NOTA: Ajusta según la estructura real de tu backend.
 * Algunas APIs usan:
 * - { items: [], pageNumber, pageSize, totalCount, totalPages }
 * - { data: [], pagination: { page, size, total } }
 * - { results: [], count, next, previous }
 */
export interface PaginatedResponseDto<T> {
  // Opción 1: Estructura directa (recomendada)
  items: T[];                 // o "data", "results"
  page: number;               // Página actual (base 1)
  pageSize: number;           // Tamaño de página
  totalCount: number;         // Total de elementos
  totalPages: number;         // Total de páginas
  hasNextPage?: boolean;      // Si hay más páginas
  hasPreviousPage?: boolean;  // Si hay página anterior

  // 🔧 Si tu backend usa una estructura diferente, ajusta aquí:
  // Opción 2: Estructura anidada
  // data: T[];
  // pagination: {
  //   currentPage: number;
  //   pageSize: number;
  //   totalItems: number;
  //   totalPages: number;
  // };

  // Opción 3: Estructura tipo cursor
  // results: T[];
  // count: number;
  // next?: string;
  // previous?: string;
}

/**
 * Respuesta simple del backend (para un solo elemento)
 */
export interface SingleResponseDto<T> {
  // Opción 1: Directa
  data: T;
  success?: boolean;
  message?: string;

  // 🔧 Si tu backend devuelve el objeto directamente sin wrapper:
  // En ese caso, usa T directamente en lugar de SingleResponseDto<T>
}

/**
 * Filtros para consultas al backend
 */
export interface CatalogFiltersDto {
  categoryId?: string;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  tags?: string[];
  sortBy?: 'name' | 'price' | 'createdAt' | 'rating';
  sortOrder?: 'asc' | 'desc';
}

// ============================================================================
// MODELOS INTERNOS DEL FRONTEND (usados en componentes)
// ============================================================================

/**
 * Modelo interno completo de producto
 * Mapeado desde ProductDto
 */
export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  images?: string[];
  sku?: string;
  stock?: number;
  active: boolean;
  categoryId?: string;
  categoryName?: string;
  tags?: string[];
  weight?: number;
  dimensions?: {
    length: number;
    width: number;
    height: number;
  };
  createdAt: string;
  updatedAt: string;
}

/**
 * Modelo interno simplificado de producto
 * Para tarjetas de producto y listados
 */
export interface ProductSummary {
  id: string;
  name: string;
  price: number;
  imageUrl: string;
  sku?: string;
  stock?: number;
  active: boolean;
  categoryName?: string;
}

/**
 * Modelo interno de categoría
 */
export interface Category {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  parentId?: string;
  sortOrder?: number;
  active: boolean;
  productsCount?: number;
}

/**
 * Filtros internos del frontend
 */
export interface CatalogFilters {
  categoryId?: string;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  tags?: string[];
}

/**
 * Respuesta paginada interna (formato del frontend)
 * Usado en el servicio después de mapear desde PaginatedResponseDto
 */
export interface PaginatedResponse<T> {
  success: boolean;          // Indica si la operación fue exitosa
  data: T[];                 // Array de elementos
  total: number;             // Total de elementos (alias de totalCount)
  page: number;              // Página actual
  pageSize: number;          // Elementos por página
  totalPages: number;        // Total de páginas
  message?: string;          // Mensaje opcional
}

/**
 * Respuesta simple interna
 */
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
}

// Type aliases para respuestas específicas
export type ProductsResponse = PaginatedResponse<ProductSummary>;
export type CategoriesResponse = PaginatedResponse<Category>;
export type ProductResponse = ApiResponse<Product>;
