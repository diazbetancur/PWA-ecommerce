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
import { AppEnvService } from '@pwa/core';
import { AppButtonComponent } from '@pwa/shared';
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
    AppButtonComponent,
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
  private readonly appEnv = inject(AppEnvService);

  // Estado
  readonly loading = signal(false);
  readonly isEditMode = signal(false);
  readonly categoryId = signal<string | null>(null);
  readonly category = signal<CategoryResponse | null>(null);
  readonly selectedImageFile = signal<File | null>(null);
  readonly imagePreviewUrl = signal<string | null>(null);

  private createdObjectUrl: string | null = null;

  // Formulario
  readonly form: FormGroup;

  readonly pageTitle = computed(() =>
    this.isEditMode() ? 'Editar Categoría' : 'Nueva Categoría'
  );

  readonly submitButtonText = computed(() =>
    this.isEditMode() ? 'Actualizar' : 'Crear'
  );

  readonly maxImageSizeMb = computed(() => this.appEnv.categoryImageMaxSizeMb);

  readonly maxImageSizeBytes = computed(
    () => this.maxImageSizeMb() * 1024 * 1024
  );

  readonly currentImageUrl = computed(() => this.category()?.imageUrl || null);

  readonly hasImagePreview = computed(
    () => !!this.imagePreviewUrl() || !!this.currentImageUrl()
  );

  readonly displayPreviewUrl = computed(
    () => this.imagePreviewUrl() || this.currentImageUrl()
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
      isActive: [true],
    });
  }

  ngOnDestroy(): void {
    this.revokeObjectUrl();
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
          isActive: category.isActive,
        });
        this.loading.set(false);
      },
      error: (error) => {
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
    const requestPayload = {
      ...formValue,
      image: this.selectedImageFile() || undefined,
    };

    if (this.isEditMode()) {
      this.updateCategory(requestPayload);
    } else {
      this.createCategory(requestPayload);
    }
  }

  onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] || null;

    if (!file) {
      this.selectedImageFile.set(null);
      this.imagePreviewUrl.set(null);
      this.revokeObjectUrl();
      return;
    }

    if (file.size > this.maxImageSizeBytes()) {
      this.snackBar.open(
        `La imagen supera el límite de ${this.maxImageSizeMb()} MB`,
        'Cerrar',
        { duration: 3500 }
      );
      input.value = '';
      this.selectedImageFile.set(null);
      this.imagePreviewUrl.set(null);
      this.revokeObjectUrl();
      return;
    }

    this.selectedImageFile.set(file);
    this.revokeObjectUrl();
    this.createdObjectUrl = URL.createObjectURL(file);
    this.imagePreviewUrl.set(this.createdObjectUrl);
  }

  clearSelectedImage(fileInput: HTMLInputElement): void {
    fileInput.value = '';
    this.selectedImageFile.set(null);
    this.imagePreviewUrl.set(null);
    this.revokeObjectUrl();
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
        this.snackBar.open(
          error.error?.message || 'Error al actualizar la categoría',
          'Cerrar',
          { duration: 3000 }
        );
        this.loading.set(false);
      },
    });
  }

  private revokeObjectUrl(): void {
    if (this.createdObjectUrl) {
      URL.revokeObjectURL(this.createdObjectUrl);
      this.createdObjectUrl = null;
    }
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
