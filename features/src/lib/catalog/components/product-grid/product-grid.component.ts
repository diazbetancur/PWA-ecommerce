import { CommonModule } from '@angular/common';
import {
  Component,
  computed,
  inject,
  input,
  OnInit,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { ProductResponse, PublicProductService } from '@pwa/core';

export type SortOption = 'price_asc' | 'price_desc' | 'name_asc' | 'name_desc';

@Component({
  selector: 'lib-product-grid',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatFormFieldModule,
    MatCardModule,
  ],
  templateUrl: './product-grid.component.html',
  styleUrl: './product-grid.component.scss',
})
export class ProductGridComponent implements OnInit {
  private readonly productService = inject(PublicProductService);

  // Inputs
  searchQuery = input<string>('');
  selectedCategoryId = input<string | null>(null);

  // Signals
  products = signal<ProductResponse[]>([]);
  loading = signal(false);
  total = signal(0);
  page = signal(1);
  pageSize = signal(12);
  sortBy = signal<SortOption>('name_asc');

  // Product quantities for "add to cart"
  quantities = signal<Map<string, number>>(new Map());

  ngOnInit(): void {
    this.loadProducts();
  }

  // Computed para detectar cambios en filtros
  private readonly filtersChanged = computed(() => ({
    search: this.searchQuery(),
    category: this.selectedCategoryId(),
    sort: this.sortBy(),
    page: this.page(),
  }));

  constructor() {
    // Recargar cuando cambien los filtros
    this.filtersChanged();
  }

  loadProducts(): void {
    this.loading.set(true);

    const [sortBy, sortOrder] = this.parseSortOption(this.sortBy());

    this.productService
      .list({
        page: this.page(),
        pageSize: this.pageSize(),
        search: this.searchQuery() || undefined,
        categoryId: this.selectedCategoryId() || undefined,
        sortBy,
        sortOrder,
      })
      .subscribe({
        next: (response) => {
          this.products.set(response.items);
          this.total.set(response.totalItems);
          this.loading.set(false);
        },
        error: () => {
          this.loading.set(false);
        },
      });
  }

  private parseSortOption(
    sort: SortOption
  ): ['name' | 'price' | 'createdAt', 'asc' | 'desc'] {
    switch (sort) {
      case 'price_asc':
        return ['price', 'asc'];
      case 'price_desc':
        return ['price', 'desc'];
      case 'name_asc':
        return ['name', 'asc'];
      case 'name_desc':
        return ['name', 'desc'];
      default:
        return ['name', 'asc'];
    }
  }

  onSortChange(value: SortOption): void {
    this.sortBy.set(value);
    this.page.set(1);
    this.loadProducts();
  }

  getQuantity(productId: string): number {
    return this.quantities().get(productId) || 1;
  }

  incrementQuantity(productId: string): void {
    const current = this.getQuantity(productId);
    const updated = new Map(this.quantities());
    updated.set(productId, current + 1);
    this.quantities.set(updated);
  }

  decrementQuantity(productId: string): void {
    const current = this.getQuantity(productId);
    if (current > 1) {
      const updated = new Map(this.quantities());
      updated.set(productId, current - 1);
      this.quantities.set(updated);
    }
  }

  addToCart(product: ProductResponse): void {
    const quantity = this.getQuantity(product.id);
    console.log(`Agregar al carrito: ${product.name} x${quantity}`);
    // TODO: Implementar servicio de carrito
    // this.cartService.add(product, quantity);
  }

  hasDiscount(product: ProductResponse): boolean {
    return !!product.compareAtPrice && product.compareAtPrice > product.price;
  }

  getDiscountPercent(product: ProductResponse): number {
    if (!this.hasDiscount(product) || !product.compareAtPrice) return 0;
    const discount =
      ((product.compareAtPrice - product.price) / product.compareAtPrice) * 100;
    return Math.round(discount);
  }

  nextPage(): void {
    this.page.set(this.page() + 1);
    this.loadProducts();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  previousPage(): void {
    if (this.page() > 1) {
      this.page.set(this.page() - 1);
      this.loadProducts();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  get totalPages(): number {
    return Math.ceil(this.total() / this.pageSize());
  }

  get hasNextPage(): boolean {
    return this.page() < this.totalPages;
  }

  get hasPreviousPage(): boolean {
    return this.page() > 1;
  }
}
