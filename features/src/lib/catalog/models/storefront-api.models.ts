/**
 * 🏪 Storefront API Models
 *
 * Modelos TypeScript basados en la documentación de Storefront API
 * Base URL: /api/store
 * Requiere header: X-Tenant-Slug
 */

// ============================================
// BANNERS
// ============================================

export interface StoreBannerDto {
  id: string;
  title: string;
  subtitle?: string | null;
  imageUrlDesktop: string;
  imageUrlMobile?: string | null;
  targetUrl?: string | null;
  buttonText?: string | null;
  position: 'hero' | 'sidebar' | 'footer' | 'promo';
}

// ============================================
// CATEGORÍAS
// ============================================

export interface StoreCategoryDto {
  id: string;
  name: string;
  slug: string;
  imageUrl?: string | null;
  productCount: number;
  children: StoreCategoryDto[];
}

export interface StoreCategoryDetailDto {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  imageUrl?: string | null;
  parentSlug?: string | null;
  parentName?: string | null;
  children: StoreCategoryDto[];
  productCount: number;
  metaTitle: string;
  metaDescription?: string | null;
}

export interface StoreCategoryRefDto {
  name: string;
  slug: string;
}

// ============================================
// PRODUCTOS
// ============================================

export interface StoreProductDto {
  id: string;
  name: string;
  slug: string;
  shortDescription?: string | null;
  price: number;
  compareAtPrice?: number | null;
  mainImageUrl?: string | null;
  brand?: string | null;
  inStock: boolean;
  isFeatured: boolean;
  categories: StoreCategoryRefDto[];
}

export interface StoreProductDetailDto {
  id: string;
  name: string;
  slug: string;
  sku?: string | null;
  description?: string | null;
  shortDescription?: string | null;
  price: number;
  compareAtPrice?: number | null;
  brand?: string | null;
  stock?: number | null;
  inStock: boolean;
  isFeatured: boolean;
  images: StoreProductImageDto[];
  categories: StoreCategoryRefDto[];
  tags: string[];
  metaTitle: string;
  metaDescription?: string | null;
}

export interface StoreProductImageDto {
  id: string;
  url: string;
  isPrimary: boolean;
}

export interface StoreProductSearchResult {
  id: string;
  name: string;
  slug: string;
  price: number;
  imageUrl?: string | null;
  sku?: string | null;
}

// ============================================
// PAGINACIÓN
// ============================================

export interface StoreProductListResponse {
  items: StoreProductDto[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

// ============================================
// FILTROS
// ============================================

export interface ProductFilters {
  category?: string; // Slug de la categoría
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  brand?: string;
  featured?: boolean;
  inStock?: boolean;
  sortBy?: 'price' | 'name' | 'newest';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
}

// ============================================
// ERRORES
// ============================================

export interface StorefrontError {
  error: string;
  slug?: string;
  type?: string;
  title?: string;
  status?: number;
  detail?: string;
}
