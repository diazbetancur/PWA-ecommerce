import {
  Component,
  input,
  computed,
  output,
  inject,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TenantContextService, TenantCurrencyPipe } from '@pwa/core';

export interface ProductCardData {
  id: string;
  name: string;
  price: number;
  imageUrl: string;
  stock?: number;
}

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [CommonModule, RouterModule, TenantCurrencyPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <article class="product-card" [style.--primary-color]="primaryColor()">
      <!-- Imagen del producto -->
      <div class="product-image-container">
        <img
          [src]="productImageUrl()"
          [alt]="product().name"
          class="product-image"
          loading="lazy"
          (error)="onImageError($event)"
        />

        <!-- Badge de stock -->
        @if (showStockBadge() && !isInStock()) {
        <div class="stock-badge out-of-stock">Sin Stock</div>
        }

        <!-- Overlay de acciones al hover -->
        <div class="product-overlay">
          <button
            class="quick-view-btn"
            (click)="onQuickView()"
            [attr.aria-label]="'Vista rápida de ' + product().name"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path
                d="M12 4.5C7.305 4.5 3.336 7.364 1.5 11.5c1.836 4.136 5.805 7 10.5 7s8.664-2.864 10.5-7c-1.836-4.136-5.805-7-10.5-7zm0 11.5c-2.485 0-4.5-2.015-4.5-4.5S9.515 7 12 7s4.5 2.015 4.5 4.5S14.485 16 12 16zm0-7c-1.38 0-2.5 1.12-2.5 2.5S10.62 14.5 12 14.5s2.5-1.12 2.5-2.5S13.38 9 12 9z"
              />
            </svg>
            Vista Rápida
          </button>
        </div>
      </div>

      <!-- Información del producto -->
      <div class="product-info">
        <h3 class="product-name" [title]="product().name">
          {{ product().name }}
        </h3>

        <div class="product-price-section">
          <span class="product-price">
            {{ product().price | tenantCurrency }}
          </span>

          @if (showStock() && isInStock()) {
          <span class="stock-info"> {{ product().stock }} disponibles </span>
          }
        </div>

        <!-- Botón de acción principal -->
        <div class="product-actions">
          @if (isInStock() || !product().stock) {
          <button
            class="add-to-cart-btn"
            (click)="onAddToCart()"
            [attr.aria-label]="'Agregar ' + product().name + ' al carrito'"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path
                d="M7 18c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12L8.1 13h7.45c.75 0 1.41-.41 1.75-1.03L21.7 4H5.21l-.94-2H1zm16 16c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"
              />
            </svg>
            Agregar
          </button>
          } @else {
          <button class="out-of-stock-btn" disabled>Sin Stock</button>
          }
        </div>
      </div>

      <!-- Link invisible para navegación -->
      <a
        [routerLink]="['/product', product().id]"
        class="product-link"
        [attr.aria-label]="'Ver detalles de ' + product().name"
      ></a>
    </article>
  `,
  styles: [
    `
      .product-card {
        position: relative;
        background: var(--tenant-background-color, #ffffff);
        border: 1px solid var(--tenant-outline, rgba(0, 0, 0, 0.1));
        border-radius: 12px;
        overflow: hidden;
        transition: all 0.3s ease;
        cursor: pointer;

        &:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
          border-color: var(
            --primary-color,
            var(--tenant-primary-color, #1976d2)
          );
        }
      }

      .product-image-container {
        position: relative;
        aspect-ratio: 1;
        overflow: hidden;
        background: #f5f5f5;
      }

      .product-image {
        width: 100%;
        height: 100%;
        object-fit: cover;
        transition: transform 0.3s ease;
      }

      .product-card:hover .product-image {
        transform: scale(1.05);
      }

      .stock-badge {
        position: absolute;
        top: 12px;
        right: 12px;
        padding: 4px 8px;
        border-radius: 16px;
        font-size: 0.75rem;
        font-weight: 600;
        color: white;

        &.out-of-stock {
          background: #ef4444;
        }
      }

      .product-overlay {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.4);
        display: flex;
        align-items: center;
        justify-content: center;
        opacity: 0;
        transition: opacity 0.3s ease;
      }

      .product-card:hover .product-overlay {
        opacity: 1;
      }

      .quick-view-btn {
        background: white;
        border: none;
        padding: 12px 16px;
        border-radius: 8px;
        font-weight: 500;
        display: flex;
        align-items: center;
        gap: 8px;
        cursor: pointer;
        transition: all 0.2s ease;

        &:hover {
          background: #f8f9fa;
          transform: translateY(-1px);
        }
      }

      .product-info {
        padding: 16px;
      }

      .product-name {
        margin: 0 0 8px 0;
        font-size: 1rem;
        font-weight: 600;
        line-height: 1.4;
        color: var(--tenant-text-color, #333);
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }

      .product-price-section {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 12px;
      }

      .product-price {
        font-size: 1.25rem;
        font-weight: 700;
        color: var(--primary-color, var(--tenant-primary-color, #1976d2));
      }

      .stock-info {
        font-size: 0.75rem;
        color: #6b7280;
      }

      .product-actions {
        width: 100%;
      }

      .add-to-cart-btn {
        width: 100%;
        background: var(--primary-color, var(--tenant-primary-color, #1976d2));
        color: white;
        border: none;
        padding: 12px;
        border-radius: 8px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s ease;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;

        &:hover {
          background: var(
            --primary-color,
            var(--tenant-primary-color, #1976d2)
          );
          opacity: 0.9;
          transform: translateY(-1px);
        }

        &:active {
          transform: translateY(0);
        }
      }

      .out-of-stock-btn {
        width: 100%;
        background: #9ca3af;
        color: white;
        border: none;
        padding: 12px;
        border-radius: 8px;
        font-weight: 600;
        cursor: not-allowed;
      }

      .product-link {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        text-decoration: none;
        z-index: 1;
      }

      .product-overlay,
      .add-to-cart-btn,
      .quick-view-btn {
        z-index: 2;
      }

      /* Responsive */
      @media (max-width: 768px) {
        .product-info {
          padding: 12px;
        }

        .product-name {
          font-size: 0.875rem;
        }

        .product-price {
          font-size: 1.125rem;
        }

        .add-to-cart-btn {
          padding: 10px;
          font-size: 0.875rem;
        }
      }
    `,
  ],
})
export class ProductCardComponent {
  private readonly tenantContext = inject(TenantContextService);

  // Inputs
  readonly product = input.required<ProductCardData>();
  readonly showStock = input<boolean>(false);
  readonly showStockBadge = input<boolean>(true);

  // Outputs
  readonly addToCart = output<ProductCardData>();
  readonly quickView = output<ProductCardData>();

  // Computed properties
  readonly primaryColor = computed(
    () =>
      this.tenantContext.getCurrentTenantConfig()?.theme.primary ?? '#1976d2'
  );

  readonly productImageUrl = computed(() => {
    const config = this.tenantContext.getCurrentTenantConfig();
    const imageUrl = this.product().imageUrl;

    if (!config?.cdnBaseUrl || imageUrl.startsWith('http')) {
      return imageUrl;
    }

    const cdnBase = config.cdnBaseUrl.endsWith('/')
      ? config.cdnBaseUrl
      : `${config.cdnBaseUrl}/`;

    const cleanPath = imageUrl.startsWith('/')
      ? imageUrl.substring(1)
      : imageUrl;
    return `${cdnBase}${cleanPath}`;
  });

  readonly isInStock = computed(() => {
    const stock = this.product().stock;
    return stock === undefined || stock > 0;
  });

  // Event handlers
  onAddToCart(): void {
    this.addToCart.emit(this.product());
  }

  onQuickView(): void {
    this.quickView.emit(this.product());
  }

  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.src = '/assets/images/product-placeholder.png';
  }
}
