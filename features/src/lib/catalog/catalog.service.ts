import { inject, Injectable } from '@angular/core';
import { ApiFactoryService, ApiClientService } from '@pwa/core';
import { Observable, from, map } from 'rxjs';

export interface Category {
  id: string;
  slug: string;
  name: string;
  imageUrl?: string;
  count?: number;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  images?: string[];
  imageUrl?: string;
  categoryIds?: string[];
  slug?: string;
  stock?: number;
  badges?: string[];
}

export interface Paged<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

@Injectable({ providedIn: 'root' })
export class CatalogService {
  private readonly api = inject(ApiFactoryService);
  private readonly apiClient = inject(ApiClientService);

  getCategories(): Observable<Category[]> {
    return from(this.api.adapter.categories.list());
  }

  getProducts(params: {
    q?: string;
    category?: string;
    page?: number;
    pageSize?: number;
    sort?: 'newest' | 'priceAsc' | 'priceDesc' | 'nameAsc' | 'nameDesc';
  }): Observable<Paged<Product>> {
    const { q, page = 1, pageSize = 12 } = params || {};
    // Base fetch (adapter supports q/page/pageSize)
    return from(this.api.adapter.products.list({ q, page, pageSize })).pipe(
      map((list) => {
        let items = list.slice();
        // Client-side filter by category if provided (mock data only)
        if (params.category) {
          const slug = params.category;
          const hasCategoryIds = (
            p: unknown
          ): p is { categoryIds: string[] } => {
            if (!p || typeof p !== 'object') return false;
            const rec = p as unknown as Record<string, unknown>;
            return Array.isArray(rec['categoryIds']);
          };
          items = items.filter((p) => {
            if (!hasCategoryIds(p)) return false;
            const rec = p as unknown as Record<string, unknown>;
            const cats = rec['categoryIds'] as string[];
            return cats.includes(slug);
          });
        }
        // Sort client-side (simple)
        switch (params.sort) {
          case 'priceAsc':
            items.sort((a, b) => (a.price || 0) - (b.price || 0));
            break;
          case 'priceDesc':
            items.sort((a, b) => (b.price || 0) - (a.price || 0));
            break;
          case 'nameAsc':
            items.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
            break;
          case 'nameDesc':
            items.sort((a, b) => (b.name || '').localeCompare(a.name || ''));
            break;
          default:
            // newest: assume input order is newest
            break;
        }
        // Paginate client-side if adapter ignored page/pageSize
        const start = (page - 1) * pageSize;
        const pageItems = items.slice(start, start + pageSize);
        return {
          items: pageItems,
          total: items.length,
          page,
          pageSize,
        } satisfies Paged<Product>;
      })
    );
  }

  getProductById(id: string): Observable<Product> {
    return from(this.api.adapter.products.byId(id)).pipe(
      map((p) => p as Product)
    );
  }
}
