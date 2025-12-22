import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { APP_ENV } from '@pwa/core';
import { catchError, map, Observable, of } from 'rxjs';
import { Category, StoreBanner } from '../models/catalog.models';

@Injectable({ providedIn: 'root' })
export class StoreService {
  private readonly http = inject(HttpClient);
  private readonly env = inject(APP_ENV);

  private get apiUrl(): string {
    return this.env.apiBaseUrl || '/api';
  }

  getBanners(
    position: 'hero' | 'sidebar' | 'footer' = 'hero'
  ): Observable<StoreBanner[]> {
    return this.http
      .get<StoreBanner[]>(`${this.apiUrl}/store/banners`, {
        params: { position },
      })
      .pipe(
        catchError((err) => {
          console.warn('Error loading banners:', err);
          return of([]);
        })
      );
  }

  getCategories(): Observable<Category[]> {
    return this.http.get<Category[]>(`${this.apiUrl}/store/categories`).pipe(
      catchError((err) => {
        console.warn('Error loading categories:', err);
        return of([]);
      })
    );
  }

  getCategoryBySlug(slug: string): Observable<Category | null> {
    return this.http
      .get<Category>(`${this.apiUrl}/store/categories/${slug}`)
      .pipe(
        catchError((err) => {
          if (err.status === 404) {
            console.warn(`Category not found: ${slug}`);
          } else {
            console.warn('Error loading category:', err);
          }
          return of(null);
        })
      );
  }

  getFlatCategories(): Observable<Category[]> {
    return this.getCategories().pipe(
      map((categories) => this.flattenCategories(categories))
    );
  }

  private flattenCategories(
    categories: Category[],
    parent?: Category
  ): Category[] {
    const result: Category[] = [];
    for (const cat of categories) {
      result.push({
        ...cat,
        parentSlug: parent?.slug,
        parentName: parent?.name,
      });
      if (cat.children && cat.children.length > 0) {
        result.push(...this.flattenCategories(cat.children, cat));
      }
    }
    return result;
  }
}
