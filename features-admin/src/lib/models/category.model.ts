/**
 * 📦 Modelos de Categoría
 *
 * Interfaces que corresponden a los DTOs del backend
 * para la gestión de categorías en el admin del tenant
 */

/**
 * Respuesta completa de una categoría
 */
export interface CategoryResponse {
  id: string;
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  isActive: boolean;
  productCount: number;
  parentId?: string;
  createdAt: string;
  updatedAt?: string;
}

/**
 * Item simplificado para listados
 */
export interface CategoryListItem {
  id: string;
  name: string;
  slug: string;
  imageUrl?: string;
  isActive: boolean;
  productCount: number;
}

/**
 * Respuesta paginada de categorías
 */
export interface CategoryListResponse {
  items: CategoryListItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/**
 * Request para crear categoría
 */
export interface CreateCategoryRequest {
  name: string;
  description?: string;
  imageUrl?: string;
  isActive?: boolean;
  parentId?: string;
}

/**
 * Request para actualizar categoría
 */
export interface UpdateCategoryRequest {
  name?: string;
  description?: string;
  imageUrl?: string;
  isActive?: boolean;
  parentId?: string;
}

/**
 * Parámetros para listar categorías
 */
export interface CategoryListParams {
  page?: number;
  pageSize?: number;
  search?: string;
  isActive?: boolean;
  parentId?: string;
}
