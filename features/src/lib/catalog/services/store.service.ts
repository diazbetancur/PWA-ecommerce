import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { APP_ENV } from '@pwa/core';
import { catchError, map, Observable, of } from 'rxjs';
import { Category, StoreBanner } from '../models/catalog.models';

interface BannerResponse {
  items: StoreBanner[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

interface CategoryResponse {
  items: CategoryItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

interface CategoryItem {
  id: string;
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  isActive: boolean;
  productCount: number;
}

@Injectable({ providedIn: 'root' })
export class StoreService {
  private readonly http = inject(HttpClient);
  private readonly env = inject(APP_ENV);

  private get apiUrl(): string {
    return this.env.apiBaseUrl || '/api';
  }

  /**
   * Obtener banners con paginación
   * @param position Posición del banner (hero, sidebar, footer)
   * @param page Página actual (por defecto 1)
   * @param pageSize Tamaño de página (por defecto 10)
   */
  getBanners(
    position: 'hero' | 'sidebar' | 'footer' = 'hero',
    page = 1,
    pageSize = 10
  ): Observable<StoreBanner[]> {
    return this.http
      .get<BannerResponse>(`${this.apiUrl}/api/banners`, {
        params: {
          position,
          page: page.toString(),
          pageSize: pageSize.toString(),
        },
      })
      .pipe(
        map((response) => response.items || []),
        catchError(() => of([]))
      );
  }

  /**
   * Obtener categorías con paginación
   * Solo retorna categorías activas (isActive: true)
   * @param page Página actual (por defecto 1)
   * @param pageSize Tamaño de página (por defecto 20)
   */
  getCategories(page = 1, pageSize = 20): Observable<Category[]> {
    return this.http
      .get<CategoryResponse>(`${this.apiUrl}/api/categories`, {
        params: {
          page: page.toString(),
          pageSize: pageSize.toString(),
          isActive: 'true', // Solo categorías activas
        },
      })
      .pipe(
        map((response) => {
          // Mapear la respuesta a nuestro modelo Category
          return (response.items || []).map((item) => ({
            id: item.id,
            name: item.name,
            slug: item.slug,
            description: item.description,
            imageUrl: item.imageUrl,
            active: item.isActive,
            productCount: item.productCount,
          }));
        }),
        catchError(() => of([]))
      );
  }

  /**
   * Obtener categoría por slug
   */
  getCategoryBySlug(slug: string): Observable<Category | null> {
    return this.http
      .get<CategoryItem>(`${this.apiUrl}/api/categories/slug/${slug}`)
      .pipe(
        map((item) => ({
          id: item.id,
          name: item.name,
          slug: item.slug,
          description: item.description,
          imageUrl: item.imageUrl,
          active: item.isActive,
          productCount: item.productCount,
        })),
        catchError(() => of(null))
      );
  }

  /**
   * Obtener categorías aplanadas (sin jerarquía)
   * Carga la primera página con suficientes elementos
   */
  getFlatCategories(): Observable<Category[]> {
    // Para el home, cargar suficientes categorías para el carrusel
    return this.getCategories(1, 50);
  }
}
