import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { debounceTime, distinctUntilChanged } from 'rxjs';

import { TenantContextService } from '@pwa/core';
import {
  Banner,
  BannerCarouselComponent,
  ProductCardComponent,
  ProductCardData,
  ProductsGridSkeletonComponent,
} from '@pwa/shared';
import {
  CatalogFilters,
  Category,
  ProductSummary,
} from '../models/catalog.models';
import { CatalogService } from '../services/catalog.service';
import { StoreService } from '../services/store.service';

@Component({
  selector: 'app-catalog-page',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    BannerCarouselComponent,
    ProductCardComponent,
    ProductsGridSkeletonComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="home-page">
      <!-- Banner Section -->
      @if (banners().length > 0) {
      <section class="banner-section">
        <app-banner-carousel [banners]="banners()" [autoPlayInterval]="5000" />
      </section>
      }

      <!-- Categories Section -->
      @if (categories().length > 0) {
      <section class="categories-section">
        <div class="container">
          <h2 class="section-title">Categorías</h2>
          <div class="categories-scroll">
            <button
              class="category-chip"
              [class.active]="!selectedCategory()"
              (click)="selectCategory(null)"
            >
              Todos
            </button>
            @for (category of categories(); track category.id) {
            <button
              class="category-chip"
              [class.active]="selectedCategory() === category.slug"
              (click)="selectCategory(category.slug)"
            >
              {{ category.name }}
            </button>
            }
          </div>
        </div>
      </section>
      }

      <!-- Search Section -->
      <section class="search-section">
        <div class="container">
          <div class="search-wrapper">
            <svg
              class="search-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
            <input
              [formControl]="searchControl"
              type="text"
              placeholder="Buscar productos..."
              class="search-input"
            />
            @if (searchControl.value) {
            <button
              class="clear-search"
              (click)="clearSearch()"
              aria-label="Limpiar búsqueda"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
            }
          </div>
        </div>
      </section>

      <!-- Products Section -->
      <main class="products-section">
        <div class="container">
          <!-- Results Info -->
          @if (!isLoading() && products().length > 0) {
          <div class="results-info">
            <span class="results-count"
              >{{ pagination().total }} productos</span
            >
            @if (hasActiveFilters()) {
            <button class="clear-filters" (click)="clearFilters()">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
              Limpiar filtros
            </button>
            }
          </div>
          }

          <!-- Loading State -->
          @if (isLoading()) {
          <app-products-grid-skeleton />
          }

          <!-- Products Grid -->
          @else if (products().length > 0) {
          <div class="products-grid">
            @for (product of products(); track product.id) {
            <app-product-card
              [product]="mapToCardData(product)"
              [showStock]="true"
              (addToCart)="onAddToCart($event)"
              (quickView)="onQuickView($event)"
            />
            }
          </div>

          <!-- Load More -->
          @if (showLoadMore()) {
          <div class="load-more-wrapper">
            <button
              class="load-more-btn"
              [disabled]="isLoadingMore()"
              (click)="loadMore()"
            >
              @if (isLoadingMore()) {
              <span class="spinner"></span>
              Cargando... } @else { Ver más productos }
            </button>
          </div>
          } }

          <!-- Empty State -->
          @else if (!isLoading()) {
          <div class="empty-state">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.5"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
              <line x1="8" y1="11" x2="14" y2="11" />
            </svg>
            <h3>No se encontraron productos</h3>
            <p>Intenta con otros términos o limpia los filtros</p>
            <button class="retry-btn" (click)="clearFilters()">
              Ver todos los productos
            </button>
          </div>
          }
        </div>
      </main>
    </div>
  `,
  styles: [
    `
      .home-page {
        min-height: 100vh;
        background: var(--bg-color, #fff);
      }

      .container {
        max-width: 1280px;
        margin: 0 auto;
        padding: 0 1rem;
      }

      /* Banner Section */
      .banner-section {
        padding: 1rem;
      }

      @media (min-width: 768px) {
        .banner-section {
          padding: 1.5rem;
        }
      }

      /* Categories Section */
      .categories-section {
        padding: 1.5rem 0;
        background: var(--bg-color, #fff);
      }

      .section-title {
        font-size: 1.25rem;
        font-weight: 600;
        margin: 0 0 1rem;
        color: var(--text-color, #1f2937);
      }

      .categories-scroll {
        display: flex;
        gap: 0.5rem;
        overflow-x: auto;
        padding-bottom: 0.5rem;
        scrollbar-width: none;
        -ms-overflow-style: none;
      }

      .categories-scroll::-webkit-scrollbar {
        display: none;
      }

      .category-chip {
        flex-shrink: 0;
        padding: 0.5rem 1rem;
        border: 1px solid var(--border-color, #e5e7eb);
        border-radius: 2rem;
        background: #fff;
        color: var(--text-color, #374151);
        font-size: 0.875rem;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s;
        white-space: nowrap;
      }

      .category-chip:hover {
        border-color: var(--primary-color, #3b82f6);
        color: var(--primary-color, #3b82f6);
      }

      .category-chip.active {
        background: var(--primary-color, #3b82f6);
        border-color: var(--primary-color, #3b82f6);
        color: #fff;
      }

      /* Search Section */
      .search-section {
        padding: 1rem 0 1.5rem;
        background: var(--hover-bg, #f9fafb);
        border-bottom: 1px solid var(--border-color, #e5e7eb);
      }

      .search-wrapper {
        position: relative;
        max-width: 600px;
        margin: 0 auto;
      }

      .search-icon {
        position: absolute;
        left: 1rem;
        top: 50%;
        transform: translateY(-50%);
        width: 20px;
        height: 20px;
        color: #9ca3af;
        pointer-events: none;
      }

      .search-input {
        width: 100%;
        padding: 0.875rem 3rem 0.875rem 3rem;
        border: 1px solid var(--border-color, #e5e7eb);
        border-radius: 0.75rem;
        font-size: 1rem;
        background: #fff;
        transition: all 0.2s;
      }

      .search-input:focus {
        outline: none;
        border-color: var(--primary-color, #3b82f6);
        box-shadow: 0 0 0 3px var(--primary-light, rgba(59, 130, 246, 0.1));
      }

      .search-input::placeholder {
        color: #9ca3af;
      }

      .clear-search {
        position: absolute;
        right: 0.75rem;
        top: 50%;
        transform: translateY(-50%);
        width: 28px;
        height: 28px;
        padding: 0;
        border: none;
        background: var(--hover-bg, #f3f4f6);
        border-radius: 50%;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #6b7280;
        transition: all 0.2s;
      }

      .clear-search:hover {
        background: #e5e7eb;
        color: #374151;
      }

      .clear-search svg {
        width: 14px;
        height: 14px;
      }

      /* Products Section */
      .products-section {
        padding: 1.5rem 0 3rem;
      }

      .results-info {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 1rem;
        flex-wrap: wrap;
        gap: 0.5rem;
      }

      .results-count {
        font-size: 0.875rem;
        color: #6b7280;
      }

      .clear-filters {
        display: flex;
        align-items: center;
        gap: 0.375rem;
        padding: 0.375rem 0.75rem;
        border: none;
        background: none;
        color: var(--primary-color, #3b82f6);
        font-size: 0.875rem;
        font-weight: 500;
        cursor: pointer;
        transition: opacity 0.2s;
      }

      .clear-filters:hover {
        opacity: 0.8;
      }

      .clear-filters svg {
        width: 14px;
        height: 14px;
      }

      .products-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 1rem;
      }

      @media (min-width: 640px) {
        .products-grid {
          grid-template-columns: repeat(3, 1fr);
          gap: 1.25rem;
        }
      }

      @media (min-width: 1024px) {
        .products-grid {
          grid-template-columns: repeat(4, 1fr);
          gap: 1.5rem;
        }
      }

      /* Load More */
      .load-more-wrapper {
        text-align: center;
        margin-top: 2rem;
      }

      .load-more-btn {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.75rem 2rem;
        border: 1px solid var(--primary-color, #3b82f6);
        border-radius: 0.5rem;
        background: #fff;
        color: var(--primary-color, #3b82f6);
        font-size: 0.9375rem;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s;
      }

      .load-more-btn:hover:not(:disabled) {
        background: var(--primary-color, #3b82f6);
        color: #fff;
      }

      .load-more-btn:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }

      .spinner {
        width: 18px;
        height: 18px;
        border: 2px solid currentColor;
        border-top-color: transparent;
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
      }

      @keyframes spin {
        to {
          transform: rotate(360deg);
        }
      }

      /* Empty State */
      .empty-state {
        text-align: center;
        padding: 4rem 1rem;
      }

      .empty-state svg {
        width: 80px;
        height: 80px;
        color: #d1d5db;
        margin-bottom: 1.5rem;
      }

      .empty-state h3 {
        font-size: 1.25rem;
        font-weight: 600;
        color: var(--text-color, #1f2937);
        margin: 0 0 0.5rem;
      }

      .empty-state p {
        color: #6b7280;
        margin: 0 0 1.5rem;
      }

      .retry-btn {
        padding: 0.75rem 1.5rem;
        border: none;
        border-radius: 0.5rem;
        background: var(--primary-color, #3b82f6);
        color: #fff;
        font-size: 0.9375rem;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s;
      }

      .retry-btn:hover {
        background: var(--primary-hover, #2563eb);
      }
    `,
  ],
})
export class CatalogPageComponent implements OnInit {
  private readonly catalogService = inject(CatalogService);
  private readonly storeService = inject(StoreService);
  private readonly tenantContext = inject(TenantContextService);

  readonly searchControl = new FormControl<string>('');

  readonly banners = signal<Banner[]>([]);
  readonly categories = signal<Category[]>([]);
  readonly products = signal<ProductSummary[]>([]);
  readonly selectedCategory = signal<string | null>(null);
  readonly isLoading = signal(true);
  readonly isLoadingMore = signal(false);
  readonly currentFilters = signal<CatalogFilters>({});
  readonly pagination = signal({
    page: 1,
    pageSize: 20,
    total: 0,
    totalPages: 0,
  });

  readonly hasActiveFilters = computed(() => {
    const filters = this.currentFilters();
    return !!(filters.search || filters.categorySlug);
  });

  readonly showLoadMore = computed(() => {
    const p = this.pagination();
    return p.page < p.totalPages && !this.isLoading();
  });

  ngOnInit(): void {
    this.loadBanners();
    this.loadCategories();
    this.loadProducts(true);
    this.setupSearch();
  }

  private setupSearch(): void {
    this.searchControl.valueChanges
      .pipe(debounceTime(400), distinctUntilChanged())
      .subscribe((value) => {
        this.currentFilters.update((f) => ({
          ...f,
          search: value || undefined,
        }));
        this.loadProducts(true);
      });
  }

  private loadBanners(): void {
    this.storeService.getBanners('hero').subscribe((banners) => {
      const mapped: Banner[] = banners.map((b) => ({
        id: b.id,
        title: b.title,
        subtitle: b.subtitle,
        imageUrlDesktop: b.imageUrlDesktop,
        imageUrlMobile: b.imageUrlMobile,
        targetUrl: b.targetUrl,
        buttonText: b.buttonText,
      }));
      this.banners.set(mapped);
    });
  }

  private loadCategories(): void {
    this.storeService.getFlatCategories().subscribe((categories) => {
      this.categories.set(categories);
    });
  }

  private loadProducts(reset: boolean): void {
    if (reset) {
      this.isLoading.set(true);
      this.pagination.update((p) => ({ ...p, page: 1 }));
    } else {
      this.isLoadingMore.set(true);
    }

    const page = reset ? 1 : this.pagination().page;
    const filters = this.currentFilters();

    this.catalogService.getProducts(page, 20, filters).subscribe({
      next: (response) => {
        if (response.success) {
          if (reset) {
            this.products.set(response.data);
          } else {
            this.products.update((p) => [...p, ...response.data]);
          }
          this.pagination.set({
            page: response.page,
            pageSize: response.pageSize,
            total: response.total,
            totalPages: response.totalPages,
          });
        }
        this.isLoading.set(false);
        this.isLoadingMore.set(false);
      },
      error: () => {
        this.isLoading.set(false);
        this.isLoadingMore.set(false);
      },
    });
  }

  selectCategory(categorySlug: string | null): void {
    this.selectedCategory.set(categorySlug);
    this.currentFilters.update((f) => ({
      ...f,
      categorySlug: categorySlug || undefined,
    }));
    this.loadProducts(true);
  }

  clearSearch(): void {
    this.searchControl.setValue('');
  }

  clearFilters(): void {
    this.searchControl.setValue('', { emitEvent: false });
    this.selectedCategory.set(null);
    this.currentFilters.set({});
    this.loadProducts(true);
  }

  loadMore(): void {
    if (this.showLoadMore() && !this.isLoadingMore()) {
      this.pagination.update((p) => ({ ...p, page: p.page + 1 }));
      this.loadProducts(false);
    }
  }

  onAddToCart(product: ProductCardData): void {
    console.log('Agregar al carrito:', product);
  }

  onQuickView(product: ProductCardData): void {
    console.log('Ver producto:', product);
  }

  mapToCardData(product: ProductSummary): ProductCardData {
    return {
      id: product.id,
      name: product.name,
      price: product.price,
      imageUrl: product.imageUrl,
      stock: product.stock,
    };
  }
}
