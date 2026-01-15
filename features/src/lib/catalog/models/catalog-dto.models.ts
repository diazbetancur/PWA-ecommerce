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
 * ✅ ALINEADO CON API DOCUMENTATION v1
 */
export interface ProductDto {
  id: string; // UUID
  name: string;
  description: string;
  price: number;
  discount: number; // Decimal (0.00 - 1.00) - e.g., 0.15 = 15% discount
  finalPrice: number; // price * (1 - discount)
  stock: number;
  isActive: boolean; // Si está activo/visible
  images: string[]; // Array of image URLs (required in API)
  categories: CategorySummaryDto[]; // Array of categories
  dynamicAttributes: Record<string, any>; // Key-value pairs (brand, color, etc.)
}

/**
 * DTO de resumen de categoría dentro de ProductDto
 * ✅ ALINEADO CON API DOCUMENTATION v1
 */
export interface CategorySummaryDto {
  id: string;
  name: string;
}

/**
 * DTO simplificado de producto (para listados)
 * Nota: La API devuelve ProductDto completo en listados, no una versión simplificada
 * ✅ ALINEADO CON API DOCUMENTATION v1
 */
export type ProductSummaryDto = ProductDto;

/**
 * DTO de Categoría del backend
 * Endpoint: GET /api/catalog/categories
 * ✅ ALINEADO CON API DOCUMENTATION v1
 */
export interface CategoryDto {
  id: string;
  name: string;
  description: string;
  productCount: number; // Number of active products in category (not productsCount)
}

/**
 * Respuesta paginada del backend
 * ✅ ALINEADO CON API DOCUMENTATION v1
 *
 * Ejemplo de respuesta de /api/catalog/products:
 * {
 *   "items": [...],
 *   "totalCount": 150,
 *   "page": 1,
 *   "pageSize": 20,
 *   "totalPages": 8
 * }
 */
export interface PaginatedResponseDto<T> {
  items: T[]; // Array of items
  totalCount: number; // Total number of elements
  page: number; // Current page (1-based)
  pageSize: number; // Items per page
  totalPages: number; // Total number of pages
}

/**
 * Respuesta simple del backend (para un solo elemento)
 * ⚠️ NOTA: Según la documentación API, GET /api/catalog/products/{id}
 * devuelve directamente ProductDto, no un wrapper.
 * Este tipo se mantiene por si se usa en otros endpoints.
 */
export interface SingleResponseDto<T> {
  data: T;
  success?: boolean;
  message?: string;
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
 * ✅ ACTUALIZADO para incluir campos de API v1
 */
export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  discount: number; // Decimal (0.00 - 1.00)
  finalPrice: number; // price * (1 - discount)
  imageUrl: string;
  images?: string[];
  stock?: number;
  active: boolean;
  categoryId?: string;
  categoryName?: string;
  categories?: CategorySummaryDto[]; // Array completo de categorías
  dynamicAttributes?: Record<string, any>; // Atributos flexibles
  // Campos extraídos de dynamicAttributes para conveniencia
  sku?: string;
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
 * ✅ ACTUALIZADO para incluir campos de API v1
 */
export interface ProductSummary {
  id: string;
  name: string;
  price: number;
  discount: number; // Decimal (0.00 - 1.00)
  finalPrice: number; // price * (1 - discount)
  imageUrl: string;
  sku?: string;
  stock?: number;
  active: boolean;
}

/**
 * Filtros internos del frontend
 */
export interface CatalogFilters {
  categoryId?: string;
  categorySlug?: string;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  featured?: boolean;
  tags?: string[];
}

/**
 * Respuesta paginada interna (formato del frontend)
 * Usado en el servicio después de mapear desde PaginatedResponseDto
 */
export interface PaginatedResponse<T> {
  success: boolean; // Indica si la operación fue exitosa
  data: T[]; // Array de elementos
  total: number; // Total de elementos (alias de totalCount)
  page: number; // Página actual
  pageSize: number; // Elementos por página
  totalPages: number; // Total de páginas
  message?: string; // Mensaje opcional
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
export type ProductResponse = ApiResponse<Product>;
