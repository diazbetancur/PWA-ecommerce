/**
 * 📝 Componente de Formulario de Producto
 *
 * Formulario para crear y editar productos con validaciones.
 * Soporta modo creación y edición.
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
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ActivatedRoute, Router } from '@angular/router';
import {
  CreateProductDto,
  ProductResponse,
  ProductService,
  UpdateProductDto,
} from '@pwa/core';
import { CategorySelectorDialogComponent } from '../../../components/category-selector-dialog/category-selector-dialog.component';
import { CategoryListItem } from '../../../models/category.model';
import { AppButtonComponent } from '@pwa/shared';

@Component({
  selector: 'lib-product-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatCheckboxModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    AppButtonComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './product-form.component.html',
  styleUrls: ['./product-form.component.scss'],
})
export class ProductFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly productService = inject(ProductService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly snackBar = inject(MatSnackBar);
  private readonly dialog = inject(MatDialog);

  // Estado
  readonly loading = signal(false);
  readonly isEditMode = signal(false);
  readonly productId = signal<string | null>(null);
  readonly product = signal<ProductResponse | null>(null);
  readonly selectedCategory = signal<CategoryListItem | null>(null);

  // Formulario
  readonly form: FormGroup;

  readonly pageTitle = computed(() =>
    this.isEditMode() ? 'Editar Producto' : 'Nuevo Producto'
  );

  readonly submitButtonText = computed(() =>
    this.isEditMode() ? 'Actualizar' : 'Crear'
  );

  constructor() {
    this.form = this.fb.group({
      name: [
        '',
        [
          Validators.required,
          Validators.minLength(3),
          Validators.maxLength(200),
        ],
      ],
      sku: ['', [Validators.maxLength(100)]],
      description: ['', [Validators.maxLength(5000)]],
      shortDescription: ['', [Validators.maxLength(250)]],
      price: [0, [Validators.required, Validators.min(0.01)]],
      compareAtPrice: [null, [Validators.min(0)]],
      stock: [0, [Validators.required, Validators.min(0)]],
      trackInventory: [false],
      isActive: [true],
      isFeatured: [false],
      tags: [''],
      brand: ['', [Validators.maxLength(100)]],
      mainImageUrl: [''],
      categoryId: [null], // ID de categoría (opcional)
      metaTitle: ['', [Validators.maxLength(200)]],
      metaDescription: ['', [Validators.maxLength(500)]],
    });
  }

  openCategorySelector(): void {
    const dialogRef = this.dialog.open(CategorySelectorDialogComponent, {
      width: '600px',
      maxWidth: '90vw',
      maxHeight: '80vh',
    });

    dialogRef
      .afterClosed()
      .subscribe((category: CategoryListItem | undefined) => {
        if (category) {
          this.selectedCategory.set(category);
          this.form.patchValue({ categoryId: category.id });
        }
      });
  }

  clearCategory(): void {
    this.selectedCategory.set(null);
    this.form.patchValue({ categoryId: null });
  }

  ngOnInit(): void {
    // Verificar si estamos en modo edición
    const id = this.route.snapshot.paramMap.get('id');

    if (id) {
      this.productId.set(id);
      this.isEditMode.set(true);
      this.loadProduct(id);
    }
  }

  private loadProduct(id: string): void {
    this.loading.set(true);

    this.productService.getById(id).subscribe({
      next: (product) => {
        this.product.set(product);
        this.form.patchValue({
          name: product.name,
          sku: product.sku || '',
          description: product.description || '',
          shortDescription: product.shortDescription || '',
          price: product.price,
          compareAtPrice: product.compareAtPrice || null,
          stock: product.stock,
          trackInventory: product.trackInventory,
          isActive: product.isActive,
          isFeatured: product.isFeatured,
          tags: product.tags || '',
          brand: product.brand || '',
          mainImageUrl: product.mainImageUrl || '',
          metaTitle: product.metaTitle || '',
          metaDescription: product.metaDescription || '',
        });
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error loading product:', error);
        this.snackBar.open('Error al cargar el producto', 'Cerrar', {
          duration: 3000,
        });
        this.router.navigate(['/tenant-admin/catalog/products']);
      },
    });
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);

    const formValue = this.form.value;

    if (this.isEditMode()) {
      this.updateProduct(formValue);
    } else {
      this.createProduct(formValue);
    }
  }

  private createProduct(data: CreateProductDto): void {
    this.productService.create(data).subscribe({
      next: (product) => {
        this.snackBar.open('Producto creado exitosamente', 'Cerrar', {
          duration: 2000,
        });
        this.router.navigate(['/tenant-admin/catalog/products']);
      },
      error: (error) => {
        console.error('Error creating product:', error);
        const message = error?.error?.title || 'Error al crear el producto';
        this.snackBar.open(message, 'Cerrar', { duration: 3000 });
        this.loading.set(false);
      },
    });
  }

  private updateProduct(data: UpdateProductDto): void {
    const id = this.productId();
    if (!id) return;

    this.productService.update(id, data).subscribe({
      next: (product) => {
        this.snackBar.open('Producto actualizado exitosamente', 'Cerrar', {
          duration: 2000,
        });
        this.router.navigate(['/tenant-admin/catalog/products']);
      },
      error: (error) => {
        console.error('Error updating product:', error);
        const message =
          error?.error?.title || 'Error al actualizar el producto';
        this.snackBar.open(message, 'Cerrar', { duration: 3000 });
        this.loading.set(false);
      },
    });
  }

  cancel(): void {
    this.router.navigate(['/tenant-admin/catalog/products']);
  }

  // Helpers para errores en template
  getErrorMessage(fieldName: string): string {
    const control = this.form.get(fieldName);
    if (!control || !control.errors) return '';

    const errors = control.errors;

    if (errors['required']) return 'Este campo es requerido';
    if (errors['minlength'])
      return `Mínimo ${errors['minlength'].requiredLength} caracteres`;
    if (errors['maxlength'])
      return `Máximo ${errors['maxlength'].requiredLength} caracteres`;
    if (errors['min']) return `El valor mínimo es ${errors['min'].min}`;
    if (errors['email']) return 'Email inválido';

    return 'Campo inválido';
  }
}
