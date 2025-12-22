import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  CatalogService,
  CatalogProduct,
  CatalogApiResponse,
} from '@pwa/features';
import { TenantContextService } from '@pwa/core';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="product-list-container">
      <!-- Header con info del tenant -->
      <header class="tenant-header">
        <h1>{{ tenantDisplayName() }}</h1>
        <p class="tenant-info">
          Tenant: {{ tenantSlug() }} | Currency: {{ tenantCurrency() }}
        </p>
        <div class="tenant-status" [class.ready]="isTenantReady()">
          {{ isTenantReady() ? '✅ Tenant Ready' : '⏳ Loading Tenant...' }}
        </div>
      </header>

      <!-- Lista de productos -->
      <section class="products-section">
        <h2>Productos Destacados</h2>

        @if (isLoading()) {
        <div class="loading">
          <p>Cargando productos...</p>
        </div>
        } @if (error()) {
        <div class="error">
          <p>Error: {{ error() }}</p>
          <button (click)="loadFeaturedProducts()" class="tenant-btn-primary">
            Reintentar
          </button>
        </div>
        } @if (products().length > 0) {
        <div class="products-grid">
          @for (product of products(); track product.id) {
          <div class="product-card tenant-card">
            <img
              [src]="buildProductImageUrl(product.imageUrl)"
              [alt]="product.name"
              class="product-image"
            />
            <div class="product-info">
              <h3 class="product-name">{{ product.name }}</h3>
              <p class="product-description">{{ product.description }}</p>
              <div class="product-price tenant-text-primary">
                {{ formatPrice(product.price) }}
              </div>
              <button
                (click)="viewProduct(product.id)"
                class="tenant-btn-primary"
              >
                Ver Producto
              </button>
            </div>
          </div>
          }
        </div>

        <!-- Paginación simple -->
        <div class="pagination">
          <button
            (click)="loadMore()"
            class="tenant-btn-secondary"
            [disabled]="isLoading()"
          >
            Cargar Más
          </button>
        </div>
        }
      </section>

      <!-- Información de debugging (solo desarrollo) -->
      @if (isDevelopment()) {
      <section class="debug-info">
        <h3>Debug Info</h3>
        <pre>{{ debugInfo() | json }}</pre>
      </section>
      }
    </div>
  `,
  styles: [
    `
      .product-list-container {
        padding: 1rem;
        max-width: 1200px;
        margin: 0 auto;
      }

      .tenant-header {
        padding: 2rem;
        margin-bottom: 2rem;
        border-radius: 0.5rem;
        text-align: center;
      }

      .tenant-info {
        opacity: 0.8;
        margin: 0.5rem 0;
      }

      .tenant-status {
        display: inline-block;
        padding: 0.25rem 0.75rem;
        border-radius: 1rem;
        font-size: 0.875rem;
        background: rgba(255, 255, 255, 0.1);

        &.ready {
          background: rgba(76, 175, 80, 0.2);
        }
      }

      .products-section h2 {
        margin-bottom: 1.5rem;
      }

      .products-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
        gap: 1.5rem;
        margin-bottom: 2rem;
      }

      .product-card {
        overflow: hidden;
        transition: transform 0.2s ease-in-out;

        &:hover {
          transform: translateY(-4px);
        }
      }

      .product-image {
        width: 100%;
        height: 200px;
        object-fit: cover;
      }

      .product-info {
        padding: 1rem;
      }

      .product-name {
        margin: 0 0 0.5rem 0;
        font-size: 1.125rem;
        font-weight: 600;
      }

      .product-description {
        margin: 0 0 1rem 0;
        opacity: 0.8;
        font-size: 0.875rem;
        line-height: 1.4;
      }

      .product-price {
        font-size: 1.25rem;
        font-weight: 700;
        margin-bottom: 1rem;
      }

      .pagination {
        text-align: center;
        margin: 2rem 0;
      }

      .loading,
      .error {
        text-align: center;
        padding: 2rem;
      }

      .error {
        color: #dc2626;
      }

      .debug-info {
        margin-top: 3rem;
        padding: 1rem;
        background: rgba(0, 0, 0, 0.05);
        border-radius: 0.5rem;
        font-size: 0.75rem;
      }

      .debug-info pre {
        margin: 0;
        white-space: pre-wrap;
      }
    `,
  ],
})
export class ProductListExampleComponent implements OnInit {
  private readonly catalogService = inject(CatalogService);
  private readonly tenantContext = inject(TenantContextService);

  // Signals para el estado del componente
  readonly products = signal<CatalogProduct[]>([]);
  readonly isLoading = signal<boolean>(false);
  readonly error = signal<string | null>(null);
  readonly currentPage = signal<number>(1);

  // Computed signals para información del tenant
  readonly isTenantReady = computed(() => this.tenantContext.isTenantReady());
  readonly tenantSlug = computed(() => this.tenantContext.getTenantSlug());
  readonly tenantDisplayName = computed(
    () =>
      this.tenantContext.getCurrentTenantConfig()?.tenant.displayName ??
      'Loading...'
  );
  readonly tenantCurrency = computed(
    () => this.tenantContext.getCurrentTenantConfig()?.currency ?? 'USD'
  );

  readonly debugInfo = computed(() => ({
    tenantReady: this.isTenantReady(),
    tenantSlug: this.tenantSlug(),
    tenantHeaders: this.tenantContext.getTenantHeaders(),
    productsCount: this.products().length,
    currentPage: this.currentPage(),
  }));

  ngOnInit() {
    this.loadFeaturedProducts();
  }

  /**
   * Carga los productos destacados
   */
  loadFeaturedProducts() {
    this.isLoading.set(true);
    this.error.set(null);

    this.catalogService.getFeaturedProducts(12).subscribe({
      next: (response: CatalogApiResponse<CatalogProduct>) => {
        if (response.success) {
          this.products.set(response.data);
        } else {
          this.error.set(response.message || 'Error cargando productos');
        }
        this.isLoading.set(false);
      },
      error: (err) => {
        this.error.set('Error de conexión: ' + err.message);
        this.isLoading.set(false);
        console.error('Error cargando productos:', err);
      },
    });
  }

  /**
   * Carga más productos (paginación)
   */
  loadMore() {
    if (this.isLoading()) return;

    this.isLoading.set(true);
    const nextPage = this.currentPage() + 1;

    this.catalogService.getProducts(nextPage, 12).subscribe({
      next: (response: CatalogApiResponse<CatalogProduct>) => {
        if (response.success) {
          // Agregar productos a la lista existente
          this.products.update((current) => [...current, ...response.data]);
          this.currentPage.set(nextPage);
        } else {
          this.error.set(response.message || 'Error cargando más productos');
        }
        this.isLoading.set(false);
      },
      error: (err) => {
        this.error.set('Error cargando más productos: ' + err.message);
        this.isLoading.set(false);
      },
    });
  }

  /**
   * Navega a la vista de detalle del producto
   */
  viewProduct(productId: string) {
    console.log('Ver producto:', productId);
    // Aquí implementarías la navegación al detalle
    // this.router.navigate(['/products', productId]);
  }

  /**
   * Construye la URL de imagen usando el servicio de catálogo
   */
  buildProductImageUrl(imageUrl: string): string {
    return this.catalogService.buildImageUrl(imageUrl);
  }

  /**
   * Formatea el precio según la moneda del tenant
   */
  formatPrice(price: number): string {
    const currency = this.tenantCurrency();
    const locale =
      this.tenantContext.getCurrentTenantConfig()?.locale ?? 'es-CO';

    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency,
    }).format(price);
  }

  /**
   * Verifica si estamos en modo desarrollo
   */
  isDevelopment(): boolean {
    return !globalThis?.['ng']?.['ɵglobal']?.['production'];
  }
}
