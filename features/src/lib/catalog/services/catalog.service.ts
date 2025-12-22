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

@Injectable({
  providedIn: 'root',
})
export class CatalogService {
  private readonly apiClient = inject(ApiClientService);

  getProducts(
    page = 1,
    pageSize = 20,
    filters?: CatalogFilters
  ): Observable<ProductsResponse> {
    const params: Record<string, string | number | boolean> = {
      page,
      pageSize,
    };

    if (filters) {
      if (filters.categoryId) params['categoryId'] = filters.categoryId;
      if (filters.categorySlug) params['category'] = filters.categorySlug;
      if (filters.search) params['search'] = filters.search;
      if (filters.minPrice !== undefined) params['minPrice'] = filters.minPrice;
      if (filters.maxPrice !== undefined) params['maxPrice'] = filters.maxPrice;
      if (filters.inStock !== undefined) params['inStock'] = filters.inStock;
      if (filters.featured !== undefined) params['featured'] = filters.featured;
      if (filters.tags && filters.tags.length > 0) {
        params['tags'] = filters.tags.join(',');
      }
    }

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
          console.error('[CatalogService] Error getting products:', error);
          throw error;
        })
      );
  }

  getProduct(productId: string): Observable<ProductResponse> {
    return this.apiClient
      .get<ProductDto>(`/api/catalog/products/${productId}`)
      .pipe(
        map((dto: ProductDto) => ({
          data: this.mapProductDto(dto),
          success: true,
        })),
        catchError((error: unknown) => {
          console.error(
            `[CatalogService] Error getting product ${productId}:`,
            error
          );
          throw error;
        })
      );
  }

  getCategories(): Observable<CategoriesResponse> {
    return this.apiClient.get<CategoryDto[]>('/api/catalog/categories').pipe(
      map((response: CategoryDto[]) =>
        this.mapPaginatedCategoriesResponse(response, this.mapCategoryDto)
      ),
      catchError((error: unknown) => {
        console.error('[CatalogService] Error getting categories:', error);
        throw error;
      })
    );
  }

  searchProducts(
    query: string,
    page = 1,
    pageSize = 20,
    filters?: Omit<CatalogFilters, 'search'>
  ): Observable<ProductsResponse> {
    return this.getProducts(page, pageSize, { ...filters, search: query });
  }

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
            '[CatalogService] Error getting featured products:',
            error
          );
          throw error;
        })
      );
  }

  getProductsByCategory(
    categoryId: string,
    page = 1,
    pageSize = 20,
    filters?: Omit<CatalogFilters, 'categoryId'>
  ): Observable<ProductsResponse> {
    return this.getProducts(page, pageSize, { ...filters, categoryId });
  }

  // Mappers

  private mapProductDto(dto: ProductDto): Product {
    return {
      id: dto.id,
      name: dto.name,
      description: dto.description,
      price: dto.price,
      discount: dto.discount,
      finalPrice: dto.finalPrice,
      imageUrl: dto.images[0] || '',
      images: dto.images,
      stock: dto.stock,
      active: dto.isActive,
      categoryId: dto.categories[0]?.id || '',
      categoryName: dto.categories[0]?.name || '',
      categories: dto.categories,
      sku: dto.dynamicAttributes?.['sku'] as string,
      tags: dto.dynamicAttributes?.['tags'] as string[],
      weight: dto.dynamicAttributes?.['weight'] as number,
      dimensions: dto.dynamicAttributes?.['dimensions'] as {
        length: number;
        width: number;
        height: number;
      },
      dynamicAttributes: dto.dynamicAttributes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  private mapProductSummaryDto(dto: ProductSummaryDto): ProductSummary {
    return {
      id: dto.id,
      name: dto.name,
      price: dto.price,
      discount: dto.discount,
      finalPrice: dto.finalPrice,
      imageUrl: dto.images[0] || '',
      sku: dto.dynamicAttributes?.['sku'] as string,
      stock: dto.stock,
      active: dto.isActive,
    };
  }

  private mapCategoryDto(dto: CategoryDto): Category {
    return {
      id: dto.id,
      name: dto.name,
      description: dto.description,
      imageUrl: '',
      parentId: '',
      sortOrder: 0,
      active: true,
      productsCount: dto.productCount,
    };
  }

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

  private mapPaginatedCategoriesResponse(
    response: PaginatedResponseDto<CategoryDto> | CategoryDto[],
    mapper: (dto: CategoryDto) => Category
  ): CategoriesResponse {
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

  buildImageUrl(imageUrl: string | undefined): string {
    if (!imageUrl) {
      return '/assets/images/no-image.png';
    }
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
      return imageUrl;
    }
    return imageUrl;
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
    }).format(price);
  }

  isInStock(stock: number): boolean {
    return stock > 0;
  }
}
