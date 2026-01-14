import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import {
  CreateTenantError,
  CreateTenantResponse,
  Plan,
  TenantPlan,
} from '../../models/tenant.model';
import { TenantAdminService } from '../../services/tenant-admin.service';

/**
 * Validador personalizado para email con dominio válido
 * Acepta: user@domain.com, user@domain.co, etc.
 * Rechaza: user@domain (sin extensión)
 */
function emailWithDomainValidator(
  control: AbstractControl
): ValidationErrors | null {
  if (!control.value) {
    return null; // Si está vacío, el required lo manejará
  }

  // Regex que valida email con dominio y extensión
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

  if (!emailRegex.test(control.value)) {
    return { invalidEmailFormat: true };
  }

  return null;
}

/**
 * Normaliza un string para usarlo como slug
 * - Convierte a minúsculas
 * - Reemplaza espacios y caracteres especiales por guiones
 * - Elimina caracteres no válidos
 * - Elimina guiones consecutivos
 */
function normalizeToSlug(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Elimina acentos
    .replace(/[^a-z0-9\s-]/g, '') // Solo letras, números, espacios y guiones
    .replace(/\s+/g, '-') // Espacios a guiones
    .replace(/-+/g, '-') // Guiones consecutivos a uno solo
    .replace(/^-|-$/g, ''); // Elimina guiones al inicio y final
}

@Component({
  selector: 'lib-tenant-create',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './tenant-create.component.html',
  styleUrl: './tenant-create.component.scss',
})
export class TenantCreateComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly tenantService = inject(TenantAdminService);
  private readonly router = inject(Router);

  // Expose enum to template
  readonly TenantPlan = TenantPlan;

  // State
  readonly isLoading = signal(false);
  readonly isLoadingPlans = signal(true);
  readonly error = signal<string | null>(null);
  readonly errorSuggestion = signal<string | null>(null);
  readonly showSuccessModal = signal(false);
  readonly showCopiedToast = signal(false);
  readonly plans = signal<Plan[]>([]);
  readonly createdTenant = signal<CreateTenantResponse | null>(null);

  // Form
  readonly tenantForm: FormGroup;

  constructor() {
    this.tenantForm = this.fb.group({
      name: [
        '',
        [
          Validators.required,
          Validators.minLength(3),
          Validators.maxLength(100),
        ],
      ],
      slug: ['', [Validators.required]], // Se genera automáticamente
      adminEmail: ['', [Validators.required, emailWithDomainValidator]],
      planCode: [null, [Validators.required]],
    });
  }

  async ngOnInit(): Promise<void> {
    await this.loadPlans();
  }

  async loadPlans(): Promise<void> {
    this.isLoadingPlans.set(true);
    try {
      const plans = await this.tenantService.getPlans();
      this.plans.set(plans);
    } catch (err) {
      console.error('Error al cargar planes:', err);
      this.error.set('Error al cargar los planes disponibles');
    } finally {
      this.isLoadingPlans.set(false);
    }
  }

  /**
   * Genera el slug automáticamente cuando cambia el nombre
   */
  onNameChange(): void {
    const name = this.tenantForm.get('name')?.value || '';
    const slug = normalizeToSlug(name);
    this.tenantForm.patchValue({ slug }, { emitEvent: false });
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.tenantForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  async onSubmit(): Promise<void> {
    if (this.tenantForm.invalid) {
      this.tenantForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.error.set(null);
    this.errorSuggestion.set(null);

    try {
      const formValue = this.tenantForm.value;
      const response = await this.tenantService.createTenant({
        slug: formValue.slug,
        name: formValue.name,
        planCode: formValue.planCode,
        adminEmail: formValue.adminEmail,
      });

      this.createdTenant.set(response);
      this.showSuccessModal.set(true);
      this.tenantForm.reset();
    } catch (err: unknown) {
      // Intentar extraer error y sugerencia del backend
      const errorResponse = (err as { error?: CreateTenantError })?.error;
      if (errorResponse?.error) {
        this.error.set(errorResponse.error);
        if (errorResponse.suggestion) {
          this.errorSuggestion.set(errorResponse.suggestion);
        }
      } else if (err instanceof Error) {
        this.error.set(err.message);
      } else {
        this.error.set('Error al crear el comercio. Inténtalo de nuevo.');
      }
    } finally {
      this.isLoading.set(false);
    }
  }

  goBack(): void {
    this.router.navigate(['/admin/tenants']);
  }

  closeSuccessModal(): void {
    this.showSuccessModal.set(false);
    this.createdTenant.set(null);
    this.goBack();
  }

  getAccessUrl(): string {
    const tenant = this.createdTenant();
    if (!tenant) return '';

    // En desarrollo usa localhost, en producción usaría el dominio real
    const baseUrl = window.location.origin;
    return `${baseUrl}?tenant=${tenant.slug}`;
  }

  openAccessUrl(): void {
    const url = this.getAccessUrl();
    if (url) {
      window.open(url, '_blank');
    }
  }

  copyToClipboard(text: string): void {
    navigator.clipboard.writeText(text).then(
      () => {
        this.showCopiedToast.set(true);
        setTimeout(() => {
          this.showCopiedToast.set(false);
        }, 2000);
      },
      (err) => {
        console.error('Error al copiar:', err);
      }
    );
  }
}
