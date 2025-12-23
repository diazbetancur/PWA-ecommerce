/**
 * 📝 Componente de Formulario de Categoría
 *
 * Formulario para crear y editar categorías con validaciones.
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
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ActivatedRoute, Router } from '@angular/router';
import {
  CategoryResponse,
  CreateCategoryRequest,
  UpdateCategoryRequest,
} from '../../../models/category.model';
import { CategoryService } from '../../../services/category.service';

@Component({
  selector: 'lib-category-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatCheckboxModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './category-form.component.html',
  styleUrls: ['./category-form.component.scss'],
})
export class CategoryFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly categoryService = inject(CategoryService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly snackBar = inject(MatSnackBar);

  // Estado
  readonly loading = signal(false);
  readonly isEditMode = signal(false);
  readonly categoryId = signal<string | null>(null);
  readonly category = signal<CategoryResponse | null>(null);

  // Formulario
  readonly form: FormGroup;

  readonly pageTitle = computed(() =>
    this.isEditMode() ? 'Editar Categoría' : 'Nueva Categoría'
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
          Validators.maxLength(100),
        ],
      ],
      description: ['', [Validators.maxLength(500)]],
      imageUrl: [''],
      isActive: [true],
    });
  }

  ngOnInit(): void {
    // Verificar si estamos en modo edición
    const id = this.route.snapshot.paramMap.get('id');

    if (id) {
      this.categoryId.set(id);
      this.isEditMode.set(true);
      this.loadCategory(id);
    }
  }

  private loadCategory(id: string): void {
    this.loading.set(true);

    this.categoryService.getById(id).subscribe({
      next: (category) => {
        this.category.set(category);
        this.form.patchValue({
          name: category.name,
          description: category.description || '',
          imageUrl: category.imageUrl || '',
          isActive: category.isActive,
        });
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error loading category:', error);
        this.snackBar.open('Error al cargar la categoría', 'Cerrar', {
          duration: 3000,
        });
        this.router.navigate(['/tenant-admin/catalog/categories']);
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
      this.updateCategory(formValue);
    } else {
      this.createCategory(formValue);
    }
  }

  private createCategory(data: CreateCategoryRequest): void {
    this.categoryService.create(data).subscribe({
      next: () => {
        this.snackBar.open('Categoría creada exitosamente', 'Cerrar', {
          duration: 3000,
        });
        this.router.navigate(['/tenant-admin/catalog/categories']);
      },
      error: (error) => {
        console.error('Error creating category:', error);
        this.snackBar.open(
          error.error?.message || 'Error al crear la categoría',
          'Cerrar',
          { duration: 3000 }
        );
        this.loading.set(false);
      },
    });
  }

  private updateCategory(data: UpdateCategoryRequest): void {
    const id = this.categoryId();
    if (!id) return;

    this.categoryService.update(id, data).subscribe({
      next: () => {
        this.snackBar.open('Categoría actualizada exitosamente', 'Cerrar', {
          duration: 3000,
        });
        this.router.navigate(['/tenant-admin/catalog/categories']);
      },
      error: (error) => {
        console.error('Error updating category:', error);
        this.snackBar.open(
          error.error?.message || 'Error al actualizar la categoría',
          'Cerrar',
          { duration: 3000 }
        );
        this.loading.set(false);
      },
    });
  }

  cancel(): void {
    this.router.navigate(['/tenant-admin/catalog/categories']);
  }

  // Helpers para validaciones
  getErrorMessage(fieldName: string): string {
    const control = this.form.get(fieldName);

    if (!control?.errors) return '';

    if (control.errors['required']) {
      return 'Este campo es requerido';
    }

    if (control.errors['minlength']) {
      const min = control.errors['minlength'].requiredLength;
      return `Mínimo ${min} caracteres`;
    }

    if (control.errors['maxlength']) {
      const max = control.errors['maxlength'].requiredLength;
      return `Máximo ${max} caracteres`;
    }

    return '';
  }
}
