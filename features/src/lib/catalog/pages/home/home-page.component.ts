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

import { TenantContextService } from '@pwa/core';
import {
  Banner,
  BannerCarouselComponent,
  ProductCardComponent,
  ProductCardData,
  ProductsGridSkeletonComponent,
} from '@pwa/shared';
import {
  StoreBannerDto,
  StoreCategoryDto,
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
    ProductsGridSkeletonComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './home-page.component.html',
  styleUrl: './home-page.component.scss',
})
export class HomePageComponent implements OnInit {
  private readonly storefrontApi = inject(StorefrontApiService);
  private readonly tenantContext = inject(TenantContextService);
  private readonly router = inject(Router);

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

  /**
   * Computed: Determina si se deben mostrar las categorías
   * Solo se muestran si hay más de 1 categoría activa
   */
  readonly shouldShowCategories = computed(() => {
    const cats = this.categories();
    return cats.length > 1;
  });

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
    // TODO: Implementar lógica de carrito
  }

  onQuickView(product: ProductCardData): void {
    // TODO: Implementar modal de vista rápida
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
      imageUrlDesktop: banner.imageUrlDesktop,
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
}
