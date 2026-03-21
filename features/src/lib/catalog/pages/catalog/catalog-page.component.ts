import { CommonModule, Location } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { debounceTime, distinctUntilChanged } from 'rxjs';

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
  ProductFilters,
  StoreCategoryDto,
  StoreProductDetailDto,
  StoreProductDto,
} from '../../models/storefront-api.models';
import { StorefrontApiService } from '../../services/storefront-api.service';

@Component({
  selector: 'app-catalog-page',
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
  templateUrl: './catalog-page.component.html',
  styleUrl: './catalog-page.component.scss',
})
export class CatalogPageComponent implements OnInit {
  private readonly storefrontApi = inject(StorefrontApiService);
  private readonly publicCartUi = inject(PublicCartUiService);
  private readonly authService = inject(AuthService);
  private readonly tenantAuthModal = inject(TenantAuthModalService);
  private readonly toastService = inject(ToastService);
  private readonly tenantContext = inject(TenantContextService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly location = inject(Location);

  readonly searchControl = new FormControl<string>('');

  // Estado de la aplicación
  readonly banners = signal<Banner[]>([]);
  readonly categories = signal<StoreCategoryDto[]>([]);
  readonly products = signal<StoreProductDto[]>([]);
  readonly selectedCategory = signal<string | null>(null);
  readonly navigationSource = signal<string | null>(null);
  readonly isLoading = signal(true);
  readonly isLoadingMore = signal(false);
  readonly currentFilters = signal<ProductFilters>({});
  readonly isQuickViewOpen = signal(false);
  readonly isQuickViewLoading = signal(false);
  readonly quickViewCardProduct = signal<ProductCardData | null>(null);
  readonly quickViewDetail = signal<StoreProductDetailDto | null>(null);
  readonly quickViewSelectedQuantity = signal(1);
  readonly favoriteProductIds = signal<Set<string>>(new Set());
  readonly pagination = signal({
    page: 1,
    pageSize: 20,
    totalItems: 0,
    totalPages: 0,
  });

  /**
   * Computed para determinar si se deben mostrar las categorías
   * Reglas:
   * - Si no hay categorías: NO mostrar
   * - Si hay solo 1 categoría: NO mostrar (regla de negocio)
   * - Si hay más de 1 categoría: SÍ mostrar
   */
  readonly shouldShowCategories = computed(() => {
    const cats = this.categories();
    return cats.length > 1;
  });

  readonly hasActiveFilters = computed(() => {
    const filters = this.currentFilters();
    return !!(filters.search || filters.category);
  });

  readonly showLoadMore = computed(() => {
    const p = this.pagination();
    return p.page < p.totalPages && !this.isLoading();
  });

  readonly showBackToCategories = computed(() => {
    return (
      this.navigationSource() === 'home-categories' &&
      !!this.currentFilters().category
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
    this.setupQueryParams();
    this.loadProducts(true);
    this.setupSearch();
  }

  private setupQueryParams(): void {
    this.route.queryParams.subscribe((params) => {
      this.navigationSource.set(params['from'] || null);
      const categoryFromQuery = params['category'] || null;
      this.selectedCategory.set(categoryFromQuery);

      this.currentFilters.update((f) => ({
        ...f,
        category: categoryFromQuery || undefined,
      }));
    });
  }

  goBackToCategories(): void {
    if (window.history.length > 1) {
      this.location.back();
      return;
    }

    this.router.navigate(['/'], {
      fragment: 'categorias',
    });
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

  /**
   * Carga los banners de la tienda
   * Usa la nueva Storefront API: GET /api/store/banners?position=hero
   */
  private loadBanners(): void {
    this.storefrontApi.getBanners('hero').subscribe({
      next: (banners) => {
        const mapped: Banner[] = banners.map((b) => ({
          id: b.id,
          title: b.title,
          subtitle: b.subtitle ?? undefined,
          imageUrlDesktop: b.imageUrlDesktop,
          imageUrlMobile: b.imageUrlMobile ?? undefined,
          targetUrl: b.targetUrl ?? undefined,
          buttonText: b.buttonText ?? undefined,
        }));
        this.banners.set(mapped);
      },
      error: (error) => {
        this.banners.set([]);
      },
    });
  }

  /**
   * Carga las categorías de la tienda
   * Usa la nueva Storefront API: GET /api/store/categories
   */
  private loadCategories(): void {
    this.storefrontApi.getCategories(false).subscribe({
      next: (categories) => {
        this.categories.set(categories);
      },
      error: (error) => {
        this.categories.set([]);
      },
    });
  }

  /**
   * Carga los productos con los filtros actuales
   * Usa la nueva Storefront API: GET /api/store/products
   *
   * @param reset - Si es true, reinicia la paginación
   */
  private loadProducts(reset: boolean): void {
    if (reset) {
      this.isLoading.set(true);
      this.pagination.update((p) => ({ ...p, page: 1 }));
    } else {
      this.isLoadingMore.set(true);
    }

    const page = reset ? 1 : this.pagination().page;
    const filters: ProductFilters = {
      ...this.currentFilters(),
      page,
      pageSize: 20,
    };

    this.storefrontApi.getProducts(filters).subscribe({
      next: (response) => {
        if (reset) {
          this.products.set(response.items);
        } else {
          this.products.update((p) => [...p, ...response.items]);
        }

        this.pagination.set({
          page: response.page,
          pageSize: response.pageSize,
          totalItems: response.totalItems,
          totalPages: response.totalPages,
        });

        this.isLoading.set(false);
        this.isLoadingMore.set(false);
      },
      error: (error) => {
        this.isLoading.set(false);
        this.isLoadingMore.set(false);
      },
    });
  }

  selectCategory(categorySlug: string | null): void {
    this.selectedCategory.set(categorySlug);
    this.currentFilters.update((f) => ({
      ...f,
      category: categorySlug || undefined,
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
          // no-op
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
        // no-op
      },
    });
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

  /**
   * Mapea un producto de la Storefront API al formato de ProductCardData
   */
  mapToCardData(product: StoreProductDto): ProductCardData {
    return {
      id: product.id,
      name: product.name,
      price: product.price,
      imageUrl: product.mainImageUrl || '',
      stock: product.inStock ? 100 : 0,
      slug: product.slug,
      compareAtPrice: product.compareAtPrice || undefined,
      brand: product.brand || undefined,
      shortDescription: product.shortDescription || undefined,
      isFeatured: product.isFeatured,
    };
  }
}
