import {
  Component,
  inject,
  OnInit,
  signal,
  computed,
  ChangeDetectionStrategy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged, switchMap, startWith, catchError } from 'rxjs/operators';
import { EMPTY, of } from 'rxjs';

import { CatalogService } from '../services/catalog.service';
import { ProductSummary, CatalogFilters, ProductsResponse } from '../models/catalog.models';
import { TenantContextService } from '@pwa/core';
import {
  ProductCardComponent,
  ProductCardData,
  ProductsGridSkeletonComponent
} from '@pwa/shared';

@Component({
  selector: 'app-catalog-page',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    ProductCardComponent,
    ProductsGridSkeletonComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="catalog-page">
      <!-- Header del catálogo -->
      <header class="catalog-header tenant-bg-primary">
        <div class="container">
          <h1 class="catalog-title">{{ tenantDisplayName() }}</h1>
          <p class="catalog-subtitle">Explora nuestros productos</p>
        </div>
      </header>

      <!-- Filtros y búsqueda -->
      <section class="filters-section">
        <div class="container">
          <div class="filters-bar">
            <!-- Búsqueda -->
            <div class="search-box">
              <input
                [formControl]="searchControl"
                type="text"
                placeholder="Buscar productos..."
                class="search-input"
              />
              <svg class="search-icon" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
              </svg>
            </div>

            <!-- Filtros adicionales -->
            <div class="filter-controls">
              <select
                class="filter-select"
                [value]="currentFilters().categoryId || ''"
                (change)="onCategoryChange($event)"
              >
                <option value="">Todas las categorías</option>
                @for (category of availableCategories(); track category.id) {
                  <option [value]="category.id">{{ category.name }}</option>
                }
              </select>

              <button
                class="filter-toggle-btn"
                [class.active]="currentFilters().inStock"
                (click)="toggleInStockFilter()"
              >
                Solo en stock
              </button>

              @if (hasActiveFilters()) {
                <button
                  class="clear-filters-btn"
                  (click)="clearFilters()"
                >
                  Limpiar filtros
                </button>
              }
            </div>
          </div>
        </div>
      </section>

      <!-- Grid de productos -->
      <main class="products-section">
        <div class="container">
          <!-- Estado de carga -->
          @if (isLoading()) {
            <app-products-grid-skeleton />
          }

          <!-- Estado de error -->
          @else if (error()) {
            <div class="error-state">
              <div class="error-content">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
                <h3>Error al cargar productos</h3>
                <p>{{ error() }}</p>
                <button class="tenant-btn-primary" (click)="retryLoad()">
                  Reintentar
                </button>
              </div>
            </div>
          }

          <!-- Lista de productos -->
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

            <!-- Paginación -->
            @if (showLoadMore()) {
              <div class="pagination-section">
                <button
                  class="load-more-btn tenant-btn-secondary"
                  [disabled]="isLoadingMore()"
                  (click)="loadMore()"
                >
                  @if (isLoadingMore()) {
                    <svg class="spinner" width="20" height="20" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none" opacity="0.25"/>
                      <path d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" fill="currentColor"/>
                    </svg>
                    Cargando...
                  } @else {
                    Cargar más productos
                  }
                </button>
              </div>
            }
          }

          <!-- Estado vacío -->
          @else {
            <div class="empty-state">
              <div class="empty-content">
                <svg width="96" height="96" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M7 18c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12L8.1 13h7.45c.75 0 1.41-.41 1.75-1.03L21.7 4H5.21l-.94-2H1zm16 16c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
                </svg>
                <h3>No se encontraron productos</h3>
                <p>Intenta ajustar los filtros o realiza una nueva búsqueda</p>
                <button class="tenant-btn-primary" (click)="clearFilters()">
                  Ver todos los productos
                </button>
              </div>
            </div>
          }
        </div>
      </main>
    </div>
  `,
  styles: [`
    .catalog-page {
      min-height: 100vh;
    }

    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 1rem;
    }

    .catalog-header {
      padding: 3rem 0;
      text-align: center;
      color: white;
    }

    .catalog-title {
      margin: 0 0 0.5rem 0;
      font-size: 2.5rem;
      font-weight: 700;
    }

    .catalog-subtitle {
      margin: 0;
      font-size: 1.125rem;
      opacity: 0.9;
    }

    .filters-section {
      padding: 2rem 0;
      background: var(--tenant-surface-variant, #f8f9fa);
      border-bottom: 1px solid var(--tenant-outline, rgba(0, 0, 0, 0.1));
    }

    .filters-bar {
      display: flex;
      gap: 1rem;
      align-items: center;
      flex-wrap: wrap;
    }

    .search-box {
      position: relative;
      flex: 1;
      min-width: 280px;
    }

    .search-input {
      width: 100%;
      padding: 12px 16px 12px 44px;
      border: 1px solid var(--tenant-outline, #d1d5db);
      border-radius: 8px;
      font-size: 1rem;
      background: white;

      &:focus {
        outline: none;
        border-color: var(--tenant-primary-color, #1976d2);
        box-shadow: 0 0 0 3px rgba(25, 118, 210, 0.1);
      }
    }

    .search-icon {
      position: absolute;
      left: 12px;
      top: 50%;
      transform: translateY(-50%);
      color: #6b7280;
    }

    .filter-controls {
      display: flex;
      gap: 1rem;
      align-items: center;
      flex-wrap: wrap;
    }

    .filter-select {
      padding: 8px 12px;
      border: 1px solid var(--tenant-outline, #d1d5db);
      border-radius: 8px;
      background: white;
      font-size: 0.875rem;

      &:focus {
        outline: none;
        border-color: var(--tenant-primary-color, #1976d2);
      }
    }

    .filter-toggle-btn {
      padding: 8px 16px;
      border: 1px solid var(--tenant-outline, #d1d5db);
      border-radius: 8px;
      background: white;
      font-size: 0.875rem;
      cursor: pointer;
      transition: all 0.2s ease;

      &:hover {
        background: #f8f9fa;
      }

      &.active {
        background: var(--tenant-primary-color, #1976d2);
        color: white;
        border-color: var(--tenant-primary-color, #1976d2);
      }
    }

    .clear-filters-btn {
      padding: 8px 16px;
      border: none;
      background: #ef4444;
      color: white;
      border-radius: 8px;
      font-size: 0.875rem;
      cursor: pointer;

      &:hover {
        background: #dc2626;
      }
    }

    .products-section {
      padding: 2rem 0;
    }

    .products-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 1.5rem;
      margin-bottom: 3rem;
    }

    .pagination-section {
      text-align: center;
    }

    .load-more-btn {
      padding: 12px 24px;
      font-size: 1rem;
      display: inline-flex;
      align-items: center;
      gap: 8px;
    }

    .spinner {
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }

    .error-state,
    .empty-state {
      padding: 4rem 0;
      text-align: center;
    }

    .error-content,
    .empty-content {
      max-width: 400px;
      margin: 0 auto;
    }

    .error-content svg,
    .empty-content svg {
      color: #9ca3af;
      margin-bottom: 1rem;
    }

    .error-content h3,
    .empty-content h3 {
      margin: 0 0 0.5rem 0;
      font-size: 1.25rem;
      color: var(--tenant-text-color, #333);
    }

    .error-content p,
    .empty-content p {
      margin: 0 0 1.5rem 0;
      color: #6b7280;
    }

    /* Responsive */
    @media (max-width: 768px) {
      .catalog-title {
        font-size: 2rem;
      }

      .filters-bar {
        flex-direction: column;
        align-items: stretch;
      }

      .search-box {
        min-width: auto;
      }

      .filter-controls {
        justify-content: center;
      }

      .products-grid {
        grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
        gap: 1rem;
      }
    }
  `]
})
export class CatalogPageComponent implements OnInit {
  private readonly catalogService = inject(CatalogService);
  private readonly tenantContext = inject(TenantContextService);

  // Form controls
  readonly searchControl = new FormControl<string>('');

  // Signals
  readonly products = signal<ProductSummary[]>([]);
  readonly availableCategories = signal<any[]>([]);
  readonly isLoading = signal<boolean>(true);
  readonly isLoadingMore = signal<boolean>(false);
  readonly error = signal<string | null>(null);
  readonly currentFilters = signal<CatalogFilters>({});
  readonly pagination = signal({
    page: 1,
    pageSize: 20,
    total: 0,
    totalPages: 0
  });

  // Computed properties
  readonly tenantDisplayName = computed(() =>
    this.tenantContext.getCurrentTenantConfig()?.tenant.displayName ?? 'Catálogo'
  );

  readonly hasActiveFilters = computed(() => {
    const filters = this.currentFilters();
    return !!(filters.search || filters.categoryId || filters.inStock);
  });

  readonly showLoadMore = computed(() => {
    const pag = this.pagination();
    return pag.page < pag.totalPages && !this.isLoading();
  });

  ngOnInit() {
    this.setupSearch();
    this.loadInitialData();
  }

  private setupSearch() {
    this.searchControl.valueChanges.pipe(
      startWith(''),
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(query => {
        this.updateFilters({ search: query || undefined });
        return this.loadProducts(true);
      }),
      catchError(error => {
        this.error.set('Error en la búsqueda: ' + error.message);
        return EMPTY;
      })
    ).subscribe();
  }

  private async loadInitialData() {
    try {
      this.isLoading.set(true);
      this.error.set(null);

      // Cargar categorías y productos iniciales en paralelo
      const [categoriesResult] = await Promise.all([
        this.catalogService.getCategories(true).toPromise(),
        this.loadProducts(true).toPromise()
      ]);

      if (categoriesResult?.success) {
        this.availableCategories.set(categoriesResult.data);
      }

    } catch (error: any) {
      this.error.set('Error cargando el catálogo: ' + error.message);
    } finally {
      this.isLoading.set(false);
    }
  }

  private loadProducts(reset = false) {
    const filters = this.currentFilters();
    const currentPage = reset ? 1 : this.pagination().page;

    if (reset) {
      this.isLoading.set(true);
    } else {
      this.isLoadingMore.set(true);
    }

    return this.catalogService.getProducts(currentPage, 20, filters).pipe(
      catchError(error => {
        this.error.set('Error cargando productos: ' + error.message);
        return of({ success: false, data: [], total: 0, page: 1, pageSize: 20, totalPages: 0 } as ProductsResponse);
      })
    ).subscribe(response => {
      if (response.success) {
        if (reset) {
          this.products.set(response.data);
        } else {
          this.products.update(current => [...current, ...response.data]);
        }

        this.pagination.set({
          page: response.page,
          pageSize: response.pageSize,
          total: response.total,
          totalPages: response.totalPages
        });

        this.error.set(null);
      }

      this.isLoading.set(false);
      this.isLoadingMore.set(false);
    });
  }

  // Event handlers
  onCategoryChange(event: Event) {
    const select = event.target as HTMLSelectElement;
    const categoryId = select.value || undefined;
    this.updateFilters({ categoryId });
    this.loadProducts(true);
  }

  toggleInStockFilter() {
    const current = this.currentFilters();
    this.updateFilters({ inStock: !current.inStock });
    this.loadProducts(true);
  }

  clearFilters() {
    this.searchControl.setValue('', { emitEvent: false });
    this.currentFilters.set({});
    this.loadProducts(true);
  }

  loadMore() {
    if (this.showLoadMore() && !this.isLoadingMore()) {
      this.pagination.update(p => ({ ...p, page: p.page + 1 }));
      this.loadProducts(false);
    }
  }

  retryLoad() {
    this.loadProducts(true);
  }

  onAddToCart(product: ProductCardData) {
    console.log('Agregar al carrito:', product);
    // Placeholder: integrar con CartService cuando esté disponible
    alert(`${product.name} agregado al carrito`);
  }

  onQuickView(product: ProductCardData) {
    console.log('Vista rápida:', product);
    // Placeholder: abrir modal o navegar a detalle
    window.open(`/product/${product.id}`, '_blank');
  }

  // Utilities
  mapToCardData(product: ProductSummary): ProductCardData {
    return {
      id: product.id,
      name: product.name,
      price: product.price,
      imageUrl: product.imageUrl,
      stock: product.stock
    };
  }

  private updateFilters(newFilters: Partial<CatalogFilters>) {
    this.currentFilters.update(current => ({ ...current, ...newFilters }));
  }
}
