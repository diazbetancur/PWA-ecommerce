import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router } from '@angular/router';
import {
  ProductFilterDto,
  ProductResponse,
  ProductService,
  TenantAdminMenuService,
} from '@pwa/core';
import { AppButtonComponent, ConfirmationDialogService } from '@pwa/shared';

@Component({
  selector: 'lib-products-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCheckboxModule,
    MatDialogModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    AppButtonComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './products-list.component.html',
  styleUrls: ['./products-list.component.scss'],
})
export class ProductsListComponent implements OnInit {
  private readonly productService = inject(ProductService);
  private readonly menuService = inject(TenantAdminMenuService);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);
  private readonly confirmDialog = inject(ConfirmationDialogService);

  readonly products = signal<ProductResponse[]>([]);
  readonly loading = signal(false);
  readonly totalCount = signal(0);

  readonly page = signal(1);
  readonly pageSize = signal(20);
  readonly pageSizeOptions = [10, 20, 50, 100];

  readonly searchValue = signal('');

  readonly displayedColumns = computed(() => {
    const baseColumns = ['name', 'sku', 'price', 'stock', 'featured', 'active'];

    if (this.canUpdate() || this.canDelete()) {
      return [...baseColumns, 'actions'];
    }

    return baseColumns;
  });

  readonly canCreate = computed(() =>
    this.menuService.canPerformAction('catalog')
  );

  readonly canUpdate = computed(() =>
    this.menuService.canPerformAction('catalog')
  );

  readonly canDelete = computed(() =>
    this.menuService.canPerformAction('catalog')
  );

  ngOnInit(): void {
    this.loadProducts();
  }

  onSearchChanged(value: string): void {
    this.searchValue.set(value);
    this.page.set(1);
    this.loadProducts();
  }

  loadProducts(): void {
    this.loading.set(true);

    const filters: ProductFilterDto = {
      page: this.page(),
      pageSize: this.pageSize(),
      search: this.searchValue() || undefined,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    };

    this.productService.list(filters).subscribe({
      next: (response) => {
        this.products.set(response.items);
        this.totalCount.set(response.totalItems);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error loading products:', error);
        this.snackBar.open('Error al cargar productos', 'Cerrar', {
          duration: 3000,
        });
        this.loading.set(false);
      },
    });
  }

  onPageChange(event: PageEvent): void {
    this.page.set(event.pageIndex + 1);
    this.pageSize.set(event.pageSize);
    this.loadProducts();
  }

  createProduct(): void {
    this.router.navigate(['/tenant-admin/catalog/products/create']);
  }

  editProduct(product: ProductResponse): void {
    this.router.navigate(['/tenant-admin/catalog/products/edit', product.id]);
  }

  viewStockByStores(product: ProductResponse): void {
    this.router.navigate([
      '/tenant-admin/stores/products',
      product.id,
      'stock',
    ]);
  }

  toggleFeatured(product: ProductResponse): void {
    this.productService.toggleFeatured(product.id).subscribe({
      next: () => {
        const message = product.isFeatured
          ? 'Producto quitado de destacados'
          : 'Producto destacado';
        this.snackBar.open(message, 'Cerrar', { duration: 2000 });
        this.loadProducts();
      },
      error: (error) => {
        console.error('Error toggling featured:', error);
        this.snackBar.open('Error al actualizar producto', 'Cerrar', {
          duration: 3000,
        });
      },
    });
  }

  deleteProduct(product: ProductResponse): void {
    this.confirmDialog
      .confirm({
        title: 'Eliminar producto',
        message: `¿Estás seguro de eliminar el producto "${product.name}"?\n\nEsta acción no se puede deshacer.`,
        type: 'danger',
        confirmText: 'Eliminar',
        cancelText: 'Cancelar',
      })
      .subscribe((confirmed) => {
        if (confirmed) {
          this.performDelete(product.id);
        }
      });
  }

  private performDelete(productId: string): void {
    this.productService.delete(productId).subscribe({
      next: () => {
        this.snackBar.open('Producto eliminado exitosamente', 'Cerrar', {
          duration: 2000,
        });
        this.loadProducts();
      },
      error: (error) => {
        console.error('Error deleting product:', error);
        this.snackBar.open('Error al eliminar producto', 'Cerrar', {
          duration: 3000,
        });
      },
    });
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(price);
  }
}
