import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { ProductResponse, ProductService } from '@pwa/core';
import { AppButtonComponent } from '@pwa/shared';

export interface CategoryProductsDialogData {
  categoryId: string;
  categoryName: string;
}

@Component({
  selector: 'lib-category-products-modal',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    AppButtonComponent,
  ],
  templateUrl: './category-products-modal.component.html',
  styleUrl: './category-products-modal.component.scss',
})
export class CategoryProductsModalComponent implements OnInit {
  private readonly dialogRef = inject(
    MatDialogRef<CategoryProductsModalComponent>
  );
  private readonly productService = inject(ProductService);
  readonly data = inject<CategoryProductsDialogData>(MAT_DIALOG_DATA);

  readonly products = signal<ProductResponse[]>([]);
  readonly loading = signal(false);
  readonly totalCount = signal(0);
  readonly page = signal(1);
  readonly pageSize = signal(10);
  readonly pageSizeOptions = [5, 10, 20];

  readonly displayedColumns = ['name', 'sku', 'price', 'stock', 'active'];

  ngOnInit(): void {
    this.loadProducts();
  }

  loadProducts(): void {
    this.loading.set(true);

    this.productService
      .list({
        page: this.page(),
        pageSize: this.pageSize(),
        categoryId: this.data.categoryId,
        sortBy: 'name',
        sortOrder: 'asc',
      })
      .subscribe({
        next: (response) => {
          this.products.set(response.items);
          this.totalCount.set(response.totalItems);
          this.loading.set(false);
        },
        error: (error) => {
          console.error('Error loading products:', error);
          this.loading.set(false);
        },
      });
  }

  onPageChange(event: PageEvent): void {
    this.page.set(event.pageIndex + 1);
    this.pageSize.set(event.pageSize);
    this.loadProducts();
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
