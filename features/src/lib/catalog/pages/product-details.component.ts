import {
  Component,
  inject,
  OnInit,
  signal,
  computed,
  input,
  ChangeDetectionStrategy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';

import { CatalogService } from '../services/catalog.service';
import { Product } from '../models/catalog.models';
import { TenantContextService } from '@pwa/core';

@Component({
  selector: 'app-product-details',
  standalone: true,
  imports: [CommonModule, RouterModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="product-details-page">
      @if (isLoading()) {
        <div class="loading-container">
          <div class="product-skeleton">
            <div class="skeleton-image"></div>
            <div class="skeleton-content">
              <div class="skeleton-line skeleton-title"></div>
              <div class="skeleton-line skeleton-subtitle"></div>
              <div class="skeleton-line skeleton-price"></div>
              <div class="skeleton-button"></div>
            </div>
          </div>
        </div>
      }

      @else if (error()) {
        <div class="error-container">
          <h2>Error al cargar el producto</h2>
          <p>{{ error() }}</p>
          <button class="tenant-btn-primary" (click)="retry()">
            Reintentar
          </button>
          <button class="tenant-btn-secondary" (click)="goBack()">
            Volver al catálogo
          </button>
        </div>
      }

      @else if (product()) {
        <div class="product-container">
          <div class="breadcrumb">
            <a routerLink="/catalog" class="tenant-link">Catálogo</a>
            <span> / {{ product()!.name }}</span>
          </div>

          <div class="product-layout">
            <!-- Imagen principal -->
            <div class="product-image-section">
              <img
                [src]="productImageUrl()"
                [alt]="product()!.name"
                class="main-image"
              />
            </div>

            <!-- Información del producto -->
            <div class="product-info-section">
              <h1 class="product-title">{{ product()!.name }}</h1>

              <div class="product-price">
                {{ formattedPrice() }}
              </div>

              @if (product()!.stock !== undefined) {
                <div class="stock-info" [class.out-of-stock]="!isInStock()">
                  @if (isInStock()) {
                    ✅ {{ product()!.stock }} disponibles
                  } @else {
                    ❌ Sin stock
                  }
                </div>
              }

              <div class="product-description">
                <p>{{ product()!.description }}</p>
              </div>

              @if (product()!.sku) {
                <div class="product-sku">
                  SKU: {{ product()!.sku }}
                </div>
              }

              <!-- Botones de acción -->
              <div class="product-actions">
                @if (isInStock() || !product()!.stock) {
                  <button
                    class="add-to-cart-btn tenant-btn-primary"
                    (click)="addToCart()"
                  >
                    Agregar al carrito
                  </button>
                } @else {
                  <button class="out-of-stock-btn" disabled>
                    Sin stock
                  </button>
                }

                <button
                  class="back-btn tenant-btn-secondary"
                  (click)="goBack()"
                >
                  Volver al catálogo
                </button>
              </div>
            </div>
          </div>
        </div>
      }

      @else {
        <div class="not-found-container">
          <h2>Producto no encontrado</h2>
          <p>El producto que buscas no existe o ha sido eliminado.</p>
          <button class="tenant-btn-primary" routerLink="/catalog">
            Ver catálogo
          </button>
        </div>
      }
    </div>
  `,
  styles: [`
    .product-details-page {
      min-height: 100vh;
      padding: 2rem 0;
    }

    .product-container,
    .loading-container,
    .error-container,
    .not-found-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 1rem;
    }

    .breadcrumb {
      margin-bottom: 2rem;
      font-size: 0.875rem;
    }

    .product-layout {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 3rem;
      align-items: start;
    }

    .product-image-section {
      position: sticky;
      top: 2rem;
    }

    .main-image {
      width: 100%;
      aspect-ratio: 1;
      object-fit: cover;
      border-radius: 12px;
      background: #f5f5f5;
    }

    .product-info-section {
      padding: 1rem 0;
    }

    .product-title {
      font-size: 2rem;
      font-weight: 700;
      margin: 0 0 1rem 0;
      color: var(--tenant-text-color, #333);
    }

    .product-price {
      font-size: 2rem;
      font-weight: 700;
      color: var(--tenant-primary-color, #1976d2);
      margin-bottom: 1rem;
    }

    .stock-info {
      padding: 0.5rem 1rem;
      border-radius: 8px;
      font-weight: 500;
      margin-bottom: 1.5rem;
      background: #f0f9ff;
      color: #1e40af;

      &.out-of-stock {
        background: #fef2f2;
        color: #dc2626;
      }
    }

    .product-description {
      margin-bottom: 2rem;
      line-height: 1.6;
      color: #6b7280;
    }

    .product-sku {
      font-size: 0.875rem;
      color: #9ca3af;
      margin-bottom: 2rem;
    }

    .product-actions {
      display: flex;
      gap: 1rem;
      flex-wrap: wrap;
    }

    .add-to-cart-btn {
      flex: 1;
      min-width: 200px;
      padding: 1rem 2rem;
      font-size: 1.125rem;
      font-weight: 600;
    }

    .out-of-stock-btn {
      flex: 1;
      min-width: 200px;
      padding: 1rem 2rem;
      font-size: 1.125rem;
      font-weight: 600;
      background: #9ca3af;
      color: white;
      border: none;
      border-radius: 8px;
      cursor: not-allowed;
    }

    .back-btn {
      padding: 1rem 2rem;
      font-size: 1rem;
    }

    /* Estados de carga y error */
    .loading-container,
    .error-container,
    .not-found-container {
      text-align: center;
      padding: 4rem 0;
    }

    .product-skeleton {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 3rem;
      max-width: 1200px;
      margin: 0 auto;
    }

    .skeleton-image {
      aspect-ratio: 1;
      background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
      background-size: 200% 100%;
      border-radius: 12px;
      animation: skeleton-shimmer 1.5s infinite;
    }

    .skeleton-content {
      padding: 1rem 0;
    }

    .skeleton-line {
      height: 20px;
      background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
      background-size: 200% 100%;
      border-radius: 4px;
      margin-bottom: 1rem;
      animation: skeleton-shimmer 1.5s infinite;
    }

    .skeleton-title {
      width: 80%;
      height: 32px;
    }

    .skeleton-subtitle {
      width: 60%;
    }

    .skeleton-price {
      width: 40%;
      height: 28px;
    }

    .skeleton-button {
      width: 200px;
      height: 48px;
      margin-top: 2rem;
    }

    @keyframes skeleton-shimmer {
      0% { background-position: -200% 0; }
      100% { background-position: 200% 0; }
    }

    /* Responsive */
    @media (max-width: 768px) {
      .product-layout,
      .product-skeleton {
        grid-template-columns: 1fr;
        gap: 2rem;
      }

      .product-image-section {
        position: static;
      }

      .product-title {
        font-size: 1.5rem;
      }

      .product-price {
        font-size: 1.5rem;
      }

      .product-actions {
        flex-direction: column;
      }

      .add-to-cart-btn,
      .out-of-stock-btn {
        min-width: auto;
      }
    }
  `]
})
export class ProductDetailsComponent implements OnInit {
  private readonly catalogService = inject(CatalogService);
  private readonly tenantContext = inject(TenantContextService);
  private readonly router = inject(Router);

  // Input para el ID del producto (desde la ruta)
  readonly productId = input.required<string>();

  // Signals
  readonly product = signal<Product | null>(null);
  readonly isLoading = signal<boolean>(true);
  readonly error = signal<string | null>(null);

  // Computed properties
  readonly productImageUrl = computed(() => {
    const prod = this.product();
    if (!prod) return '';
    return this.catalogService.buildImageUrl(prod.imageUrl);
  });

  readonly formattedPrice = computed(() => {
    const prod = this.product();
    if (!prod) return '';
    return this.catalogService.formatPrice(prod.price);
  });

  readonly isInStock = computed(() => {
    const prod = this.product();
    return prod ? this.catalogService.isInStock(prod) : false;
  });

  ngOnInit() {
    this.loadProduct();
  }

  private loadProduct() {
    const id = this.productId();

    if (!id) {
      this.error.set('ID de producto no válido');
      this.isLoading.set(false);
      return;
    }

    this.isLoading.set(true);
    this.error.set(null);

    this.catalogService.getProduct(id).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.product.set(response.data);
        } else {
          this.error.set(response.message || 'Producto no encontrado');
        }
        this.isLoading.set(false);
      },
      error: (err) => {
        this.error.set('Error cargando el producto: ' + err.message);
        this.isLoading.set(false);
      }
    });
  }

  // Event handlers
  addToCart() {
    const prod = this.product();
    if (prod) {
      console.log('Agregar al carrito:', prod);
      // Placeholder: integrar con CartService
      alert(`${prod.name} agregado al carrito`);
    }
  }

  retry() {
    this.loadProduct();
  }

  goBack() {
    this.router.navigate(['/catalog']);
  }
}
