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
import { RouterModule } from '@angular/router';
import { debounceTime, distinctUntilChanged } from 'rxjs';

import { TenantContextService } from '@pwa/core';
import {
  Banner,
  BannerCarouselComponent,
  mapProductToCard,
  ProductCardComponent,
  ProductCardData,
  ProductsGridSkeletonComponent,
} from '@pwa/shared';
import {
  CatalogFilters,
  Category,
  ProductSummary,
} from '../models/catalog.models';
import { CatalogService } from '../services/catalog.service';
import { StoreService } from '../services/store.service';

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
  private readonly catalogService = inject(CatalogService);
  private readonly storeService = inject(StoreService);
  private readonly tenantContext = inject(TenantContextService);

  readonly searchControl = new FormControl<string>('');

  readonly banners = signal<Banner[]>([]);
  readonly categories = signal<Category[]>([]);
  readonly products = signal<ProductSummary[]>([]);
  readonly selectedCategory = signal<string | null>(null);
  readonly isLoading = signal(true);
  readonly isLoadingMore = signal(false);
  readonly currentFilters = signal<CatalogFilters>({});
  readonly pagination = signal({
    page: 1,
    pageSize: 20,
    total: 0,
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
    return !!(filters.search || filters.categorySlug);
  });

  readonly showLoadMore = computed(() => {
    const p = this.pagination();
    return p.page < p.totalPages && !this.isLoading();
  });

  ngOnInit(): void {
    this.loadBanners();
    this.loadCategories();
    this.loadProducts(true);
    this.setupSearch();
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

  private loadBanners(): void {
    this.storeService.getBanners('hero').subscribe((banners) => {
      const mapped: Banner[] = banners.map((b) => ({
        id: b.id,
        title: b.title,
        subtitle: b.subtitle,
        imageUrlDesktop: b.imageUrlDesktop,
        imageUrlMobile: b.imageUrlMobile,
        targetUrl: b.targetUrl,
        buttonText: b.buttonText,
      }));
      this.banners.set(mapped);
    });
  }

  private loadCategories(): void {
    this.storeService.getFlatCategories().subscribe((categories) => {
      this.categories.set(categories);
    });
  }

  private loadProducts(reset: boolean): void {
    if (reset) {
      this.isLoading.set(true);
      this.pagination.update((p) => ({ ...p, page: 1 }));
    } else {
      this.isLoadingMore.set(true);
    }

    const page = reset ? 1 : this.pagination().page;
    const filters = this.currentFilters();

    this.catalogService.getProducts(page, 20, filters).subscribe({
      next: (response) => {
        if (response.success) {
          if (reset) {
            this.products.set(response.data);
          } else {
            this.products.update((p) => [...p, ...response.data]);
          }
          this.pagination.set({
            page: response.page,
            pageSize: response.pageSize,
            total: response.total,
            totalPages: response.totalPages,
          });
        }
        this.isLoading.set(false);
        this.isLoadingMore.set(false);
      },
      error: () => {
        this.isLoading.set(false);
        this.isLoadingMore.set(false);
      },
    });
  }

  selectCategory(categorySlug: string | null): void {
    this.selectedCategory.set(categorySlug);
    this.currentFilters.update((f) => ({
      ...f,
      categorySlug: categorySlug || undefined,
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
    console.log('Agregar al carrito:', product);
  }

  onQuickView(product: ProductCardData): void {
    console.log('Ver producto:', product);
  }

  mapToCardData(product: ProductSummary): ProductCardData {
    // Usa el helper de mapeo que maneja mainImageUrl correctamente
    return mapProductToCard(product as any);
  }
}
