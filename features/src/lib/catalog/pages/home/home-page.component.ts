/**
 * 🏠 Home Page Component
 *
 * Página principal de la tienda para clientes con tenant activo.
 * Muestra:
 * - Banners hero
 * - Productos destacados
 * - Categorías (si hay más de 1)
 * - Búsqueda de productos
 *
 * Usa la Storefront API (/api/store) que requiere X-Tenant-Slug header
 */

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
import { Router, RouterModule } from '@angular/router';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs';

import {
  AuthService,
  PublicCartUiService,
  TenantContextService,
} from '@pwa/core';
import { TenantAuthModalService } from '@pwa/features-account';
import {
  Banner,
  BannerCarouselComponent,
  ProductCardComponent,
  ProductCardData,
  ProductsGridSkeletonComponent,
  ToastService,
} from '@pwa/shared';
import {
  ProductQuickViewModalComponent,
  QuickViewProductData,
} from '../../components/product-quick-view-modal/product-quick-view-modal.component';
import {
  StoreBannerDto,
  StoreCategoryDto,
  StoreProductDetailDto,
  StoreProductDto,
  StoreProductSearchResult,
} from '../../models/storefront-api.models';
import { StorefrontApiService } from '../../services/storefront-api.service';

@Component({
  selector: 'lib-home-page',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    BannerCarouselComponent,
    ProductCardComponent,
    ProductQuickViewModalComponent,
    ProductsGridSkeletonComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './home-page.component.html',
  styleUrl: './home-page.component.scss',
})
export class HomePageComponent implements OnInit {
  private readonly storefrontApi = inject(StorefrontApiService);
  private readonly publicCartUi = inject(PublicCartUiService);
  private readonly tenantContext = inject(TenantContextService);
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly tenantAuthModal = inject(TenantAuthModalService);
  private readonly toastService = inject(ToastService);

  // Controles de formulario
  readonly searchControl = new FormControl<string>('');

  // Estado de la aplicación
  readonly banners = signal<Banner[]>([]);
  readonly categories = signal<StoreCategoryDto[]>([]);
  readonly featuredProducts = signal<StoreProductDto[]>([]);
  readonly searchResults = signal<StoreProductSearchResult[]>([]);
  readonly isLoadingBanners = signal(false);
  readonly isLoadingCategories = signal(false);
  readonly isLoadingProducts = signal(true);
  readonly isSearching = signal(false);
  readonly showSearchResults = signal(false);
  readonly isQuickViewOpen = signal(false);
  readonly isQuickViewLoading = signal(false);
  readonly quickViewCardProduct = signal<ProductCardData | null>(null);
  readonly quickViewDetail = signal<StoreProductDetailDto | null>(null);
  readonly quickViewSelectedQuantity = signal(1);
  readonly favoriteProductIds = signal<Set<string>>(new Set());

  /**
   * Computed: Determina si se deben mostrar las categorías
   * Solo se muestran si hay más de 1 categoría activa
   */
  readonly shouldShowCategories = computed(() => {
    const cats = this.categories();
    return cats.length > 1;
  });

  readonly categorySkeletonItems = computed(() =>
    Array.from({ length: 6 }, (_, index) => index)
  );

  /**
   * Computed: Determina si hay algún loading activo
   */
  readonly isLoading = computed(() => {
    return (
      this.isLoadingBanners() ||
      this.isLoadingCategories() ||
      this.isLoadingProducts()
    );
  });

  readonly quickViewProduct = computed<QuickViewProductData | null>(() => {
    const card = this.quickViewCardProduct();
    if (!card) {
      return null;
    }

    const detail = this.quickViewDetail();
    const imageUrls =
      detail?.images
        ?.map((image) => image.url)
        .filter((url): url is string => !!url) ?? [];

    const fallbackImages = card.imageUrl ? [card.imageUrl] : [];

    return {
      id: card.id,
      slug: card.slug,
      name: detail?.name ?? card.name,
      shortDescription: detail?.shortDescription ?? card.shortDescription,
      description: detail?.description ?? card.shortDescription,
      price: detail?.price ?? card.price,
      compareAtPrice: detail?.compareAtPrice ?? card.compareAtPrice,
      stock: detail?.stock ?? undefined,
      inStock: detail?.inStock ?? (card.stock === undefined || card.stock > 0),
      imageUrls: imageUrls.length > 0 ? imageUrls : fallbackImages,
    };
  });

  readonly quickViewQuantity = computed(() => this.quickViewSelectedQuantity());

  readonly quickViewIsFavorite = computed(() => {
    const product = this.quickViewProduct();
    if (!product) {
      return false;
    }

    return this.favoriteProductIds().has(product.id);
  });

  ngOnInit(): void {
    this.loadBanners();
    this.loadCategories();
    this.loadFeaturedProducts();
    this.setupSearchAutocomplete();
  }

  // ============================================
  // CARGA DE DATOS
  // ============================================

  /**
   * Carga los banners hero de la tienda
   * GET /api/store/banners?position=hero
   */
  private loadBanners(): void {
    this.isLoadingBanners.set(true);
    this.storefrontApi.getBanners('hero').subscribe({
      next: (banners) => {
        const mapped: Banner[] = banners.map((b) => this.mapBanner(b));
        this.banners.set(mapped);
        this.isLoadingBanners.set(false);
      },
      error: (error) => {
        this.banners.set([]);
        this.isLoadingBanners.set(false);
      },
    });
  }

  /**
   * Carga las categorías de la tienda
   * GET /api/store/categories
   */
  private loadCategories(): void {
    this.isLoadingCategories.set(true);
    this.storefrontApi.getCategories(false).subscribe({
      next: (categories) => {
        this.categories.set(categories);
        this.isLoadingCategories.set(false);
      },
      error: (error) => {
        this.categories.set([]);
        this.isLoadingCategories.set(false);
      },
    });
  }

  /**
   * Carga los productos destacados para el home
   * GET /api/store/products/featured?limit=8
   */
  private loadFeaturedProducts(): void {
    this.isLoadingProducts.set(true);
    this.storefrontApi.getFeaturedProducts(8).subscribe({
      next: (products) => {
        this.featuredProducts.set(products);
        this.isLoadingProducts.set(false);
      },
      error: (error) => {
        this.featuredProducts.set([]);
        this.isLoadingProducts.set(false);
      },
    });
  }

  // ============================================
  // BÚSQUEDA
  // ============================================

  /**
   * Configura el autocompletado de búsqueda con debounce
   * GET /api/store/products/search?q={query}&limit=10
   */
  private setupSearchAutocomplete(): void {
    this.searchControl.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        switchMap((query) => {
          if (!query || query.length < 2) {
            this.searchResults.set([]);
            this.showSearchResults.set(false);
            this.isSearching.set(false);
            return [];
          }

          this.isSearching.set(true);
          return this.storefrontApi.searchProducts(query, 10);
        })
      )
      .subscribe({
        next: (results) => {
          this.searchResults.set(results);
          this.showSearchResults.set(results.length > 0);
          this.isSearching.set(false);
        },
        error: (error) => {
          this.searchResults.set([]);
          this.showSearchResults.set(false);
          this.isSearching.set(false);
        },
      });
  }

  /**
   * Limpia la búsqueda
   */
  clearSearch(): void {
    this.searchControl.setValue('', { emitEvent: false });
    this.searchResults.set([]);
    this.showSearchResults.set(false);
  }

  /**
   * Navega a la página de búsqueda con el término actual
   */
  performSearch(): void {
    const query = this.searchControl.value?.trim();
    if (query && query.length >= 2) {
      this.router.navigate(['/catalog'], {
        queryParams: { search: query },
      });
      this.clearSearch();
    }
  }

  /**
   * Navega a la página de detalle del producto
   */
  goToProduct(productSlug: string): void {
    this.router.navigate(['/catalog/products', productSlug]);
    this.clearSearch();
  }

  // ============================================
  // NAVEGACIÓN
  // ============================================

  /**
   * Navega a la página de una categoría específica
   */
  goToCategory(categorySlug: string): void {
    this.router.navigate(['/catalog'], {
      queryParams: { category: categorySlug },
    });
  }

  goToCategoryExplorer(categorySlug: string): void {
    this.router.navigate(['/catalog'], {
      queryParams: {
        category: categorySlug,
        from: 'home-categories',
      },
    });
  }

  /**
   * Navega a la página de catálogo completo
   */
  goToCatalog(): void {
    this.router.navigate(['/catalog']);
  }

  // ============================================
  // ACCIONES DE PRODUCTOS
  // ============================================

  onAddToCart(product: ProductCardData): void {
    this.publicCartUi.addItem({
      productId: product.id,
      name: product.name,
      imageUrl: product.imageUrl,
      unitPrice: product.price,
      quantity: 1,
    });
  }

  onQuickView(product: ProductCardData): void {
    this.quickViewCardProduct.set(product);
    this.quickViewDetail.set(null);
    this.quickViewSelectedQuantity.set(1);
    this.isQuickViewOpen.set(true);
    this.syncFavoriteStatus(product.id);

    if (!product.slug) {
      this.isQuickViewLoading.set(false);
      return;
    }

    this.isQuickViewLoading.set(true);
    const requestedProductId = product.id;

    this.storefrontApi.getProductBySlug(product.slug).subscribe({
      next: (detail) => {
        if (this.quickViewCardProduct()?.id !== requestedProductId) {
          return;
        }

        this.quickViewDetail.set(detail);
        this.isQuickViewLoading.set(false);
      },
      error: () => {
        if (this.quickViewCardProduct()?.id !== requestedProductId) {
          return;
        }

        this.quickViewDetail.set(null);
        this.isQuickViewLoading.set(false);
      },
    });
  }

  closeQuickView(): void {
    this.isQuickViewOpen.set(false);
    this.isQuickViewLoading.set(false);
    this.quickViewCardProduct.set(null);
    this.quickViewDetail.set(null);
    this.quickViewSelectedQuantity.set(1);
  }

  addToCartFromQuickView(): void {
    const product = this.quickViewProduct();
    if (!product) {
      return;
    }

    this.publicCartUi.addItem({
      productId: product.id,
      name: product.name,
      imageUrl:
        product.imageUrls[0] ?? '/assets/images/product-placeholder.webp',
      unitPrice: product.price,
      quantity: this.quickViewSelectedQuantity(),
    });

    this.closeQuickView();
  }

  incrementQuickViewQuantity(): void {
    this.quickViewSelectedQuantity.update((qty) => qty + 1);
  }

  decrementQuickViewQuantity(): void {
    this.quickViewSelectedQuantity.update((qty) => Math.max(1, qty - 1));
  }

  toggleQuickViewFavorite(): void {
    const product = this.quickViewProduct();
    if (!product) {
      return;
    }

    if (!this.authService.isAuthenticated()) {
      this.toastService.warning(
        'Debes iniciar sesión antes de agregar productos a favoritos'
      );
      this.closeQuickView();
      setTimeout(() => this.tenantAuthModal.open('login'), 0);
      return;
    }

    const isFavorite = this.favoriteProductIds().has(product.id);

    if (isFavorite) {
      this.storefrontApi.removeFavorite(product.id).subscribe({
        next: () => {
          this.favoriteProductIds.update((currentSet) => {
            const nextSet = new Set(currentSet);
            nextSet.delete(product.id);
            return nextSet;
          });
        },
        error: () => {
          // no-op: mantener estado actual si falla backend
        },
      });
      return;
    }

    this.storefrontApi.addFavorite(product.id).subscribe({
      next: () => {
        this.favoriteProductIds.update((currentSet) => {
          const nextSet = new Set(currentSet);
          nextSet.add(product.id);
          return nextSet;
        });
      },
      error: () => {
        // no-op: mantener estado actual si falla backend
      },
    });
  }

  // ============================================
  // MAPPERS
  // ============================================

  /**
   * Mapea un banner de la API al formato interno
   */
  private mapBanner(banner: StoreBannerDto): Banner {
    return {
      id: banner.id,
      title: banner.title,
      subtitle: banner.subtitle ?? undefined,
      imageUrl: banner.imageUrl ?? undefined,
      imageUrlDesktop: banner.imageUrlDesktop ?? banner.imageUrl ?? undefined,
      imageUrlMobile: banner.imageUrlMobile ?? undefined,
      targetUrl: banner.targetUrl ?? undefined,
      buttonText: banner.buttonText ?? undefined,
    };
  }

  /**
   * Mapea un producto de la API al formato de ProductCardData
   */
  mapProductToCard(product: StoreProductDto): ProductCardData {
    return {
      id: product.id,
      name: product.name,
      price: product.price,
      imageUrl: product.mainImageUrl || '',
      stock: product.inStock ? 100 : 0,
      slug: product.slug,
      compareAtPrice: product.compareAtPrice ?? undefined,
      brand: product.brand ?? undefined,
      shortDescription: product.shortDescription ?? undefined,
      isFeatured: product.isFeatured,
    };
  }

  private syncFavoriteStatus(productId: string): void {
    if (!this.authService.isAuthenticated()) {
      this.favoriteProductIds.update((currentSet) => {
        const nextSet = new Set(currentSet);
        nextSet.delete(productId);
        return nextSet;
      });
      return;
    }

    this.storefrontApi.checkFavorite(productId).subscribe({
      next: (response) => {
        this.favoriteProductIds.update((currentSet) => {
          const nextSet = new Set(currentSet);
          if (response.isFavorite) {
            nextSet.add(productId);
          } else {
            nextSet.delete(productId);
          }
          return nextSet;
        });
      },
      error: () => {
        // no-op
      },
    });
  }
}
