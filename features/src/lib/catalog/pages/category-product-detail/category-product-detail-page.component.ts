import { CommonModule, CurrencyPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { AuthService, PublicCartUiService } from '@pwa/core';

import { StoreProductDetailDto } from '../../models/storefront-api.models';
import { StorefrontApiService } from '../../services/storefront-api.service';

@Component({
  selector: 'app-category-product-detail-page',
  standalone: true,
  imports: [CommonModule, RouterModule, CurrencyPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './category-product-detail-page.component.html',
  styleUrl: './category-product-detail-page.component.scss',
})
export class CategoryProductDetailPageComponent implements OnInit {
  private readonly storefrontApi = inject(StorefrontApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly publicCartUi = inject(PublicCartUiService);

  readonly categorySlug = signal<string>('');
  readonly productSlug = signal<string>('');

  readonly product = signal<StoreProductDetailDto | null>(null);
  readonly loading = signal<boolean>(true);
  readonly error = signal<string | null>(null);
  readonly isFavorite = signal<boolean>(false);
  readonly selectedImageIndex = signal<number>(0);

  readonly productImages = computed(() => {
    const product = this.product();
    if (!product || product.images.length === 0) {
      return ['/assets/images/product-placeholder.webp'];
    }

    return product.images.map((image) => image.url);
  });

  readonly currentImage = computed(
    () =>
      this.productImages()[this.selectedImageIndex()] ?? this.productImages()[0]
  );

  readonly hasImageGallery = computed(() => this.productImages().length > 1);

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      const categorySlug = params.get('categorySlug') || '';
      const productSlug = params.get('productSlug') || '';

      this.categorySlug.set(categorySlug);
      this.productSlug.set(productSlug);
      this.loadProduct(productSlug);
    });
  }

  goBackToCategoryProducts(): void {
    this.router.navigate(['/categories', this.categorySlug(), 'products']);
  }

  isAuthenticated(): boolean {
    return this.authService.isAuthenticated();
  }

  addToCart(): void {
    const product = this.product();
    if (!product) {
      return;
    }

    this.publicCartUi.addItem({
      productId: product.id,
      name: product.name,
      imageUrl: this.currentImage(),
      unitPrice: product.price,
      quantity: 1,
    });
  }

  selectImage(index: number): void {
    if (index < 0 || index >= this.productImages().length) {
      return;
    }

    this.selectedImageIndex.set(index);
  }

  toggleFavorite(): void {
    if (!this.authService.isAuthenticated()) {
      return;
    }

    const product = this.product();
    if (!product) {
      return;
    }

    if (this.isFavorite()) {
      this.storefrontApi.removeFavorite(product.id).subscribe({
        next: () => {
          this.isFavorite.set(false);
        },
        error: () => {
          // no-op
        },
      });
      return;
    }

    this.storefrontApi.addFavorite(product.id).subscribe({
      next: () => {
        this.isFavorite.set(true);
      },
      error: () => {
        // no-op
      },
    });
  }

  private loadProduct(productSlug: string): void {
    if (!productSlug) {
      this.error.set('Producto no válido');
      this.loading.set(false);
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    this.storefrontApi.getProductBySlug(productSlug).subscribe({
      next: (product) => {
        this.product.set(product);
        const preferredIndex = product.images.findIndex(
          (image) => image.isPrimary
        );
        this.selectedImageIndex.set(Math.max(preferredIndex, 0));
        this.syncFavoriteStatus(product.id);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('No se pudo cargar el detalle del producto');
        this.product.set(null);
        this.isFavorite.set(false);
        this.selectedImageIndex.set(0);
        this.loading.set(false);
      },
    });
  }

  private syncFavoriteStatus(productId: string): void {
    if (!this.authService.isAuthenticated()) {
      this.isFavorite.set(false);
      return;
    }

    this.storefrontApi.checkFavorite(productId).subscribe({
      next: (response) => {
        this.isFavorite.set(response.isFavorite);
      },
      error: () => {
        this.isFavorite.set(false);
      },
    });
  }
}
