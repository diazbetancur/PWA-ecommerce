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
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
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
import { TenantAdminMenuService } from '@pwa/core';
import {
  AppButtonComponent,
  ConfirmationDialogService,
  SearchInputComponent,
} from '@pwa/shared';
import { CategoryProductsModalComponent } from '../../../components/category-products-modal/category-products-modal.component';
import {
  CategoryListItem,
  CategoryListParams,
} from '../../../models/category.model';
import { CategoryService } from '../../../services/category.service';

@Component({
  selector: 'lib-categories-list',
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
    SearchInputComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './categories-list.component.html',
  styleUrls: ['./categories-list.component.scss'],
})
export class CategoriesListComponent implements OnInit {
  private readonly categoryService = inject(CategoryService);
  private readonly menuService = inject(TenantAdminMenuService);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);
  private readonly confirmDialog = inject(ConfirmationDialogService);
  private readonly dialog = inject(MatDialog);

  readonly categories = signal<CategoryListItem[]>([]);
  readonly loading = signal(false);
  readonly totalCount = signal(0);

  readonly page = signal(1);
  readonly pageSize = signal(20);
  readonly pageSizeOptions = [10, 20, 50, 100];

  readonly searchValue = signal('');

  readonly displayedColumns = computed(() => {
    const baseColumns = [
      'name',
      // 'slug',
      // 'description',
      'status',
      'productCount',
    ];

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
    this.loadCategories();
  }

  onSearchChanged(value: string): void {
    this.searchValue.set(value);
    this.page.set(1);
    this.loadCategories();
  }

  loadCategories(): void {
    this.loading.set(true);

    const params: CategoryListParams = {
      page: this.page(),
      pageSize: this.pageSize(),
      search: this.searchValue() || undefined,
    };

    this.categoryService.list(params).subscribe({
      next: (response) => {
        this.categories.set(response.items);
        this.totalCount.set(response.total);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error loading categories:', error);
        this.snackBar.open('Error al cargar categorías', 'Cerrar', {
          duration: 3000,
        });
        this.loading.set(false);
      },
    });
  }

  onPageChange(event: PageEvent): void {
    this.page.set(event.pageIndex + 1);
    this.pageSize.set(event.pageSize);
    this.loadCategories();
  }

  createCategory(): void {
    this.router.navigate(['/tenant-admin/catalog/categories/create']);
  }

  editCategory(category: CategoryListItem): void {
    this.router.navigate([
      '/tenant-admin/catalog/categories',
      category.id,
      'edit',
    ]);
  }

  deleteCategory(category: CategoryListItem): void {
    this.confirmDialog
      .confirm({
        title: 'Eliminar categoría',
        message: `¿Estás seguro de eliminar la categoría "${category.name}"?\n\nLos ${category.productCount} productos asociados NO se eliminarán, solo se desvincularán.`,
        type: 'danger',
        confirmText: 'Eliminar',
        cancelText: 'Cancelar',
      })
      .subscribe((confirmed) => {
        if (confirmed) {
          this.performDelete(category.id);
        }
      });
  }

  private performDelete(categoryId: string): void {
    this.loading.set(true);

    this.categoryService.delete(categoryId).subscribe({
      next: () => {
        this.snackBar.open('Categoría eliminada exitosamente', 'Cerrar', {
          duration: 3000,
        });
        this.loadCategories();
      },
      error: (error) => {
        console.error('Error deleting category:', error);
        this.snackBar.open(
          error.error?.message || 'Error al eliminar categoría',
          'Cerrar',
          { duration: 3000 }
        );
        this.loading.set(false);
      },
    });
  }

  viewDetails(category: CategoryListItem): void {
    this.dialog.open(CategoryProductsModalComponent, {
      width: '800px',
      maxWidth: '90vw',
      data: {
        categoryId: category.id,
        categoryName: category.name,
      },
    });
  }
}
