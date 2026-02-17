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
import { ActivatedRoute, RouterModule } from '@angular/router';
import { debounceTime, distinctUntilChanged } from 'rxjs';

import { TenantContextService } from '@pwa/core';
import {
  Banner,
  BannerCarouselComponent,
  ProductCardComponent,
  ProductCardData,
  ProductsGridSkeletonComponent,
} from '@pwa/shared';
import {
  ProductFilters,
  StoreCategoryDto,
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
    ProductsGridSkeletonComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './catalog-page.component.html',
  styleUrl: './catalog-page.component.scss',
})
export class CatalogPageComponent implements OnInit {
  private readonly storefrontApi = inject(StorefrontApiService);
  private readonly tenantContext = inject(TenantContextService);
  private readonly route = inject(ActivatedRoute);

  readonly searchControl = new FormControl<string>('');

  // Estado de la aplicación
  readonly banners = signal<Banner[]>([]);
  readonly categories = signal<StoreCategoryDto[]>([]);
  readonly products = signal<StoreProductDto[]>([]);
  readonly selectedCategory = signal<string | null>(null);
  readonly isLoading = signal(true);
  readonly isLoadingMore = signal(false);
  readonly currentFilters = signal<ProductFilters>({});
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

  ngOnInit(): void {
    this.loadBanners();
    this.loadCategories();
    this.setupQueryParams();
    this.loadProducts(true);
    this.setupSearch();
  }

  private setupQueryParams(): void {
    this.route.queryParams.subscribe((params) => {
      if (params['category']) {
        this.currentFilters.update((f) => ({
          ...f,
          category: params['category'],
        }));
      }
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
  }

  onQuickView(product: ProductCardData): void {
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
