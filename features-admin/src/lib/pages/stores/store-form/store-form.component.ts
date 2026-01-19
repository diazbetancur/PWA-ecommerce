import { CommonModule } from '@angular/common';
import {
  Component,
  computed,
  DestroyRef,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import {
  CreateStoreRequest,
  StoreDto,
  UpdateStoreRequest,
} from '../../../models/store.models';
import { StoreAdminService } from '../../../services/store-admin.service';

/**
 * 🏪 Componente de Formulario de Tienda
 *
 * Maneja tanto la creación como la edición de tiendas.
 * El modo se determina por la presencia de un ID en la ruta.
 */
@Component({
  selector: 'lib-store-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './store-form.component.html',
  styleUrl: './store-form.component.scss',
})
export class StoreFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly storeService = inject(StoreAdminService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);

  // Signals
  mode = signal<'create' | 'edit'>('create');
  storeId = signal<string | null>(null);
  loading = signal(false);
  submitting = signal(false);
  error = signal<string | null>(null);
  originalStore = signal<StoreDto | null>(null);

  // Form
  storeForm: FormGroup;

  // Computed
  pageTitle = computed(() =>
    this.mode() === 'create' ? 'Nueva Tienda' : 'Editar Tienda'
  );
  submitButtonText = computed(() => {
    if (this.submitting()) return 'Guardando...';
    return this.mode() === 'create' ? 'Crear Tienda' : 'Guardar Cambios';
  });
  canDeactivate = computed(() => {
    const store = this.originalStore();
    return (
      !store ||
      !store.isDefault ||
      this.storeForm.get('isActive')?.value === true
    );
  });

  constructor() {
    // Inicializar formulario
    this.storeForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      code: [''],
      address: [''],
      city: [''],
      country: [''],
      phone: [''],
      isDefault: [false],
      isActive: [true],
    });
  }

  ngOnInit(): void {
    // Determinar modo según parámetros de ruta
    const id = this.route.snapshot.paramMap.get('id');

    if (id) {
      this.mode.set('edit');
      this.storeId.set(id);
      this.loadStore(id);
    } else {
      this.mode.set('create');
    }
  }

  /**
   * Cargar datos de la tienda (modo edición)
   */
  private loadStore(id: string): void {
    this.loading.set(true);
    this.error.set(null);

    this.storeService
      .getStoreById(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (store) => {
          this.originalStore.set(store);
          this.storeForm.patchValue({
            name: store.name,
            code: store.code || '',
            address: store.address || '',
            city: store.city || '',
            country: store.country || '',
            phone: store.phone || '',
            isDefault: store.isDefault,
            isActive: store.isActive,
          });
          this.loading.set(false);

          // Deshabilitar isActive si es la tienda default
          if (store.isDefault) {
            this.storeForm.get('isActive')?.disable();
          }
        },
        error: (err) => {
          console.error('Error al cargar tienda:', err);
          this.error.set('Error al cargar la tienda');
          this.loading.set(false);
        },
      });
  }

  /**
   * Enviar formulario
   */
  onSubmit(): void {
    if (this.storeForm.invalid) {
      this.storeForm.markAllAsTouched();
      return;
    }

    this.submitting.set(true);
    this.error.set(null);

    if (this.mode() === 'create') {
      this.createStore();
    } else {
      this.updateStore();
    }
  }

  /**
   * Crear nueva tienda
   */
  private createStore(): void {
    const request: CreateStoreRequest = {
      name: this.storeForm.value.name.trim(),
      code: this.storeForm.value.code?.trim() || undefined,
      address: this.storeForm.value.address?.trim() || undefined,
      city: this.storeForm.value.city?.trim() || undefined,
      country: this.storeForm.value.country?.trim() || undefined,
      phone: this.storeForm.value.phone?.trim() || undefined,
      isDefault: this.storeForm.value.isDefault || false,
    };

    this.storeService
      .createStore(request)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.toastService.success('Sucursal creada exitosamente');
          this.router.navigate(['/tenant-admin/settings/stores']);
        },
        error: (err) => {
          console.error('Error al crear tienda:', err);
          const message =
            err.error?.detail ||
            err.error?.errors?.[0]?.message ||
            'Error al crear la tienda';
          this.error.set(message);
          this.submitting.set(false);
        },
      });
  }

  /**
   * Actualizar tienda existente
   */
  private updateStore(): void {
    const id = this.storeId();
    if (!id) return;

    const request: UpdateStoreRequest = {
      name: this.storeForm.value.name.trim(),
      code: this.storeForm.value.code?.trim() || undefined,
      address: this.storeForm.value.address?.trim() || undefined,
      city: this.storeForm.value.city?.trim() || undefined,
      country: this.storeForm.value.country?.trim() || undefined,
      phone: this.storeForm.value.phone?.trim() || undefined,
      isDefault: this.storeForm.value.isDefault,
      isActive:
        this.storeForm.get('isActive')?.value ??
        this.originalStore()?.isActive ??
        true,
    };

    this.storeService
      .updateStore(id, request)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.toastService.success('Sucursal actualizada exitosamente');
          this.router.navigate(['/tenant-admin/settings/stores']);
        },
        error: (err) => {
          console.error('Error al actualizar tienda:', err);
          const message =
            err.error?.detail ||
            err.error?.errors?.[0]?.message ||
            'Error al actualizar la tienda';
          this.error.set(message);
          this.submitting.set(false);
        },
      });
  }

  /**
   * Cancelar y volver
   */
  onCancel(): void {
    this.router.navigate(['/tenant-admin/settings/stores']);
  }

  /**
   * Verificar si un campo tiene error
   */
  hasError(fieldName: string, errorType?: string): boolean {
    const field = this.storeForm.get(fieldName);
    if (!field) return false;

    if (errorType) {
      return field.hasError(errorType) && (field.dirty || field.touched);
    }

    return field.invalid && (field.dirty || field.touched);
  }

  /**
   * Obtener mensaje de error de un campo
   */
  getErrorMessage(fieldName: string): string {
    const field = this.storeForm.get(fieldName);
    if (!field?.errors) return '';

    if (field.errors['required']) {
      return 'Este campo es requerido';
    }

    if (field.errors['minlength']) {
      const minLength = field.errors['minlength'].requiredLength;
      return `Debe tener al menos ${minLength} caracteres`;
    }

    return 'Campo inválido';
  }
}
