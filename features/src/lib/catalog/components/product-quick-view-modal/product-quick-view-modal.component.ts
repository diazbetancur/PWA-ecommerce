import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  input,
  output,
  signal,
} from '@angular/core';
import { TenantCurrencyPipe } from '@pwa/core';

export interface QuickViewProductData {
  id: string;
  slug?: string;
  name: string;
  description?: string;
  shortDescription?: string;
  price: number;
  compareAtPrice?: number;
  stock?: number;
  inStock?: boolean;
  imageUrls: string[];
}

@Component({
  selector: 'lib-product-quick-view-modal',
  standalone: true,
  imports: [CommonModule, TenantCurrencyPipe],
  templateUrl: './product-quick-view-modal.component.html',
  styleUrl: './product-quick-view-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductQuickViewModalComponent {
  readonly isOpen = input<boolean>(false);
  readonly isLoading = input<boolean>(false);
  readonly product = input<QuickViewProductData | null>(null);
  readonly quantity = input<number>(0);
  readonly isFavorite = input<boolean>(false);

  readonly closed = output<void>();
  readonly addToCart = output<void>();
  readonly increment = output<void>();
  readonly decrement = output<void>();
  readonly toggleFavorite = output<void>();

  private readonly selectedMediaIndex = signal(0);

  readonly mediaUrls = computed(() => {
    const product = this.product();
    if (!product?.imageUrls?.length) {
      return ['/assets/images/product-placeholder.webp'];
    }

    return product.imageUrls;
  });

  readonly currentMediaUrl = computed(
    () => this.mediaUrls()[this.selectedMediaIndex()] ?? this.mediaUrls()[0]
  );

  readonly hasMediaGallery = computed(() => this.mediaUrls().length > 1);

  readonly hasDiscount = computed(() => {
    const product = this.product();
    return !!product?.compareAtPrice && product.compareAtPrice > product.price;
  });

  constructor() {
    effect(() => {
      this.product();
      this.selectedMediaIndex.set(0);
    });
  }

  onBackdropClose(): void {
    this.closed.emit();
  }

  onCloseClick(event: Event): void {
    event.stopPropagation();
    this.closed.emit();
  }

  onToggleFavorite(event: Event): void {
    event.stopPropagation();
    this.toggleFavorite.emit();
  }

  onAddToCart(event: Event): void {
    event.stopPropagation();
    this.addToCart.emit();
  }

  onIncrement(event: Event): void {
    event.stopPropagation();
    this.increment.emit();
  }

  onDecrement(event: Event): void {
    event.stopPropagation();
    this.decrement.emit();
  }

  selectMedia(index: number, event: Event): void {
    event.stopPropagation();
    this.selectedMediaIndex.set(index);
  }

  goToPreviousMedia(event: Event): void {
    event.stopPropagation();
    const total = this.mediaUrls().length;
    if (total <= 1) {
      return;
    }

    const nextIndex =
      (this.selectedMediaIndex() - 1 + total) % this.mediaUrls().length;
    this.selectedMediaIndex.set(nextIndex);
  }

  goToNextMedia(event: Event): void {
    event.stopPropagation();
    const total = this.mediaUrls().length;
    if (total <= 1) {
      return;
    }

    const nextIndex = (this.selectedMediaIndex() + 1) % this.mediaUrls().length;
    this.selectedMediaIndex.set(nextIndex);
  }
}
