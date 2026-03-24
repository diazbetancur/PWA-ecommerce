import { CommonModule, CurrencyPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { AuthService, PublicCartUiService } from '@pwa/core';

import {
  StoreCategoryDetailDto,
  StoreProductDto,
} from '../../models/storefront-api.models';
import { StorefrontApiService } from '../../services/storefront-api.service';

@Component({
  selector: 'app-category-products-page',
  standalone: true,
  imports: [CommonModule, RouterModule, CurrencyPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './category-products-page.component.html',
  styleUrl: './category-products-page.component.scss',
})
export class CategoryProductsPageComponent implements OnInit {
  private readonly storefrontApi = inject(StorefrontApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly publicCartUi = inject(PublicCartUiService);

  readonly categorySlug = signal<string>('');
  readonly category = signal<StoreCategoryDetailDto | null>(null);
  readonly products = signal<StoreProductDto[]>([]);
  readonly loading = signal<boolean>(true);
  readonly error = signal<string | null>(null);
  readonly favoriteProductIds = signal<Set<string>>(new Set());

  ngOnInit(): void {
    this.loadFavoritesIfAuthenticated();

    this.route.paramMap.subscribe((params) => {
      const slug = params.get('categorySlug') || '';
      this.categorySlug.set(slug);
      this.loadCategoryProducts(slug);
    });
  }

  goBackToCategories(): void {
    this.router.navigate(['/categories']);
  }

  goToProductDetail(productSlug: string): void {
    this.router.navigate([
      '/categories',
      this.categorySlug(),
      'products',
      productSlug,
    ]);
  }

  isAuthenticated(): boolean {
    return this.authService.isAuthenticated();
  }

  isFavorite(productId: string): boolean {
    return this.favoriteProductIds().has(productId);
  }

  addToCart(product: StoreProductDto): void {
    this.publicCartUi.addItem({
      productId: product.id,
      name: product.name,
      imageUrl:
        product.mainImageUrl || '/assets/images/product-placeholder.webp',
      unitPrice: product.price,
      quantity: 1,
    });
  }

  toggleFavorite(productId: string): void {
    if (!this.authService.isAuthenticated()) {
      return;
    }

    if (this.favoriteProductIds().has(productId)) {
      this.storefrontApi.removeFavorite(productId).subscribe({
        next: () => {
          this.favoriteProductIds.update((currentSet) => {
            const nextSet = new Set(currentSet);
            nextSet.delete(productId);
            return nextSet;
          });
        },
        error: () => {
          // no-op
        },
      });
      return;
    }

    this.storefrontApi.addFavorite(productId).subscribe({
      next: () => {
        this.favoriteProductIds.update((currentSet) => {
          const nextSet = new Set(currentSet);
          nextSet.add(productId);
          return nextSet;
        });
      },
      error: () => {
        // no-op
      },
    });
  }

  trackByProductId(_: number, product: StoreProductDto): string {
    return product.id;
  }

  private loadCategoryProducts(slug: string): void {
    if (!slug) {
      this.error.set('Categoría no válida');
      this.loading.set(false);
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    this.storefrontApi.getCategoryBySlug(slug).subscribe({
      next: (category) => {
        this.category.set(category);
      },
      error: () => {
        this.category.set(null);
      },
    });

    this.storefrontApi.getProductsByCategory(slug, 1, 50).subscribe({
      next: (response) => {
        this.products.set(response.items);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('No se pudieron cargar los productos de esta categoría');
        this.products.set([]);
        this.loading.set(false);
      },
    });
  }

  private loadFavoritesIfAuthenticated(): void {
    if (!this.authService.isAuthenticated()) {
      this.favoriteProductIds.set(new Set());
      return;
    }

    this.storefrontApi.getFavorites().subscribe({
      next: (response) => {
        const ids = response.items.map((item) => item.productId);
        this.favoriteProductIds.set(new Set(ids));
      },
      error: () => {
        this.favoriteProductIds.set(new Set());
      },
    });
  }
}
