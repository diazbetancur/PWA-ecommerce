import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  output,
} from '@angular/core';
import { RouterModule } from '@angular/router';
import { TenantContextService, TenantCurrencyPipe } from '@pwa/core';

export interface ProductCardData {
  id: string;
  name: string;
  price: number;
  imageUrl: string;
  stock?: number;
  slug?: string;
  compareAtPrice?: number;
  brand?: string;
  shortDescription?: string;
  isFeatured?: boolean;
}

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [CommonModule, RouterModule, TenantCurrencyPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './product-card.component.html',
  styleUrl: './product-card.component.scss',
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

    // Si no hay imagen, usar placeholder
    if (!imageUrl) {
      return '/assets/images/product-placeholder.webp';
    }

    // Si ya es una URL completa, usarla directamente
    if (imageUrl.startsWith('http')) {
      return imageUrl;
    }

    // Si no hay CDN configurado, usar la ruta tal cual
    if (!config?.cdnBaseUrl) {
      return imageUrl;
    }

    // Construir URL con CDN
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
    img.src = '/assets/images/product-placeholder.webp';
  }
}
