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
  createdAt: string;
  updatedAt: string;
  tags?: string[];
  weight?: number;
  dimensions?: {
    length: number;
    width: number;
    height: number;
  };
}

export interface ProductSummary {
  id: string;
  name: string;
  price: number;
  imageUrl: string;
  sku?: string;
  stock?: number;
  active: boolean;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string | null;
  parentId?: string;
  parentSlug?: string;
  parentName?: string;
  sortOrder?: number;
  active?: boolean;
  productCount?: number;
  children?: Category[];
  metaTitle?: string;
  metaDescription?: string;
}

export interface StoreBanner {
  id: string;
  title: string;
  subtitle?: string | null;
  imageUrlDesktop: string;
  imageUrlMobile?: string | null;
  targetUrl?: string | null;
  buttonText?: string | null;
  position: 'hero' | 'sidebar' | 'footer';
}

export interface CatalogFilters {
  categoryId?: string;
  categorySlug?: string;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  tags?: string[];
  featured?: boolean;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  message?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface ProductsResponse extends PaginatedResponse<ProductSummary> {}
export interface CategoriesResponse extends ApiResponse<Category[]> {}
export interface ProductResponse extends ApiResponse<Product> {}
