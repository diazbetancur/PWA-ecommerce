import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { ProductResponse, ProductService } from '@pwa/core';
import { CategoryListItem } from '../../../models/category.model';
import { CategoryService } from '../../../services/category.service';

export interface RewardProductSelectorDialogData {
  mode?: 'single' | 'multiple';
  selectedProductIds?: string[];
}

export interface RewardProductSelectionResult {
  selectedProducts: Array<{ productId: string; productName: string }>;
}

@Component({
  selector: 'lib-reward-product-selector-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule],
  templateUrl: './reward-product-selector-dialog.component.html',
  styleUrl: './reward-product-selector-dialog.component.scss',
})
export class RewardProductSelectorDialogComponent implements OnInit {
  private readonly dialogRef = inject(
    MatDialogRef<RewardProductSelectorDialogComponent>
  );
  private readonly productService = inject(ProductService);
  private readonly categoryService = inject(CategoryService);
  readonly data = inject<RewardProductSelectorDialogData>(MAT_DIALOG_DATA);

  readonly loading = signal(false);
  readonly categories = signal<CategoryListItem[]>([]);
  readonly products = signal<ProductResponse[]>([]);
  readonly page = signal(1);
  readonly pageSize = 10;
  readonly totalPages = signal(1);
  readonly selectionMode = signal<'single' | 'multiple'>('single');

  searchTerm = '';
  selectedCategoryId = '';
  selectedProductIds = signal<string[]>([]);

  ngOnInit(): void {
    this.selectionMode.set(this.data.mode || 'single');
    this.selectedProductIds.set(this.data.selectedProductIds || []);
    this.loadCategories();
    this.loadProducts();
  }

  loadCategories(): void {
    this.categoryService
      .list({
        page: 1,
        pageSize: 200,
        isActive: true,
      })
      .subscribe({
        next: (response) => {
          this.categories.set(response.items || []);
        },
      });
  }

  loadProducts(): void {
    this.loading.set(true);

    this.productService
      .list({
        page: this.page(),
        pageSize: this.pageSize,
        search: this.searchTerm.trim() || undefined,
        categoryId: this.selectedCategoryId || undefined,
        isActive: true,
        sortBy: 'name',
        sortOrder: 'asc',
      })
      .subscribe({
        next: (response) => {
          this.products.set(response.items || []);
          this.totalPages.set(response.totalPages || 1);
          this.loading.set(false);
        },
        error: () => {
          this.products.set([]);
          this.totalPages.set(1);
          this.loading.set(false);
        },
      });
  }

  search(): void {
    this.page.set(1);
    this.loadProducts();
  }

  onCategoryChange(): void {
    this.page.set(1);
    this.loadProducts();
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages()) {
      return;
    }

    this.page.set(page);
    this.loadProducts();
  }

  isSelected(productId: string): boolean {
    return this.selectedProductIds().includes(productId);
  }

  toggleProduct(product: ProductResponse): void {
    if (this.selectionMode() === 'single') {
      this.selectedProductIds.set([product.id]);
      return;
    }

    this.selectedProductIds.update((current) => {
      if (current.includes(product.id)) {
        return current.filter((id) => id !== product.id);
      }

      return [...current, product.id];
    });
  }

  confirmSelection(): void {
    const selectedIds = new Set(this.selectedProductIds());
    if (selectedIds.size === 0) {
      return;
    }

    const currentPageMap = new Map(
      this.products().map((product) => [product.id, product.name])
    );

    const selectedProducts = Array.from(selectedIds).map((productId) => ({
      productId,
      productName: currentPageMap.get(productId) || 'Producto seleccionado',
    }));

    this.dialogRef.close({
      selectedProducts,
    } as RewardProductSelectionResult);
  }

  close(): void {
    this.dialogRef.close();
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(price);
  }
}
