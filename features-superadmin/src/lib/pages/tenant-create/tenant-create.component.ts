import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { Plan, TenantPlan } from '../../models/tenant.model';
import { TenantAdminService } from '../../services/tenant-admin.service';

@Component({
  selector: 'lib-tenant-create',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="create-container">
      <!-- Header -->
      <div class="page-header">
        <button class="btn-back" (click)="goBack()">
          <span class="material-icons">arrow_back</span>
        </button>
        <div class="header-content">
          <h1 class="page-title">Crear Nuevo Comercio</h1>
          <p class="page-subtitle">
            Crea un nuevo comercio con su base de datos y configuración inicial
          </p>
        </div>
      </div>

      <!-- Form Card -->
      <div class="form-card">
        <form [formGroup]="tenantForm" (ngSubmit)="onSubmit()">
          <!-- Slug -->
          <div class="form-group">
            <label class="form-label" for="slug">
              Slug <span class="required">*</span>
            </label>
            <input
              id="slug"
              type="text"
              class="form-input"
              formControlName="slug"
              placeholder="mi-tienda"
              [class.error]="isFieldInvalid('slug')"
            />
            <p class="form-hint">
              <span class="material-icons hint-icon">info</span>
              Identificador único para el comercio. Solo letras minúsculas,
              números y guiones. Ejemplo: mi-tienda-online
            </p>
            @if (isFieldInvalid('slug')) {
            <p class="form-error">
              <span class="material-icons">error</span>
              @if (tenantForm.get('slug')?.hasError('required')) { El slug es
              requerido } @else if (tenantForm.get('slug')?.hasError('pattern'))
              { Solo se permiten letras minúsculas, números y guiones } @else if
              (tenantForm.get('slug')?.hasError('minlength')) { Mínimo 3
              caracteres } @else if
              (tenantForm.get('slug')?.hasError('maxlength')) { Máximo 50
              caracteres }
            </p>
            }
          </div>

          <!-- Name -->
          <div class="form-group">
            <label class="form-label" for="name">
              Nombre <span class="required">*</span>
            </label>
            <input
              id="name"
              type="text"
              class="form-input"
              formControlName="name"
              placeholder="Mi Tienda Online"
              [class.error]="isFieldInvalid('name')"
            />
            <p class="form-hint">
              <span class="material-icons hint-icon">info</span>
              Nombre visible del comercio
            </p>
            @if (isFieldInvalid('name')) {
            <p class="form-error">
              <span class="material-icons">error</span>
              @if (tenantForm.get('name')?.hasError('required')) { El nombre es
              requerido } @else if
              (tenantForm.get('name')?.hasError('minlength')) { Mínimo 3
              caracteres } @else if
              (tenantForm.get('name')?.hasError('maxlength')) { Máximo 100
              caracteres }
            </p>
            }
          </div>

          <!-- Plan -->
          <div class="form-group">
            <label class="form-label" for="planCode">
              Plan <span class="required">*</span>
            </label>

            @if (isLoadingPlans()) {
            <div class="loading-plans">
              <span class="spinner"></span>
              <p>Cargando planes disponibles...</p>
            </div>
            } @else if (plans().length === 0) {
            <div class="alert alert-warning">
              <span class="material-icons">warning</span>
              No se encontraron planes disponibles
            </div>
            } @else {
            <div class="plan-cards">
              @for (plan of plans(); track plan.id) {
              <label
                class="plan-card"
                [class.selected]="
                  tenantForm.get('planCode')?.value === plan.code
                "
                [class.premium]="plan.code === 'Premium'"
              >
                <input
                  type="radio"
                  formControlName="planCode"
                  [value]="plan.code"
                  class="plan-radio"
                />
                <div class="plan-content">
                  <span class="material-icons plan-icon">
                    {{
                      plan.code === 'Premium'
                        ? 'workspace_premium'
                        : 'storefront'
                    }}
                  </span>
                  <h3 class="plan-name">{{ plan.name }}</h3>
                  <ul class="plan-features">
                    @for (limit of plan.limits.slice(0, 6); track
                    limit.limitCode) {
                    <li>
                      <span class="material-icons">check</span>
                      {{ limit.description }}
                    </li>
                    } @if (plan.limits.length > 6) {
                    <li class="more-features">
                      <span class="material-icons">add</span>
                      Y {{ plan.limits.length - 6 }} características más
                    </li>
                    }
                  </ul>
                </div>
              </label>
              }
            </div>
            } @if (isFieldInvalid('planCode')) {
            <p class="form-error">
              <span class="material-icons">error</span>
              Selecciona un plan
            </p>
            }
          </div>

          <!-- Error general -->
          @if (error()) {
          <div class="alert alert-error">
            <span class="material-icons">error</span>
            <div class="alert-content">
              <strong>Error al crear comercio</strong>
              <p>{{ error() }}</p>
            </div>
          </div>
          }

          <!-- Actions -->
          <div class="form-actions">
            <button
              type="button"
              class="btn btn-secondary"
              (click)="goBack()"
              [disabled]="isLoading()"
            >
              Cancelar
            </button>
            <button
              type="submit"
              class="btn btn-primary"
              [disabled]="isLoading() || tenantForm.invalid"
            >
              @if (isLoading()) {
              <span class="spinner-small"></span>
              Creando... } @else {
              <span class="material-icons">add</span>
              Crear Comercio }
            </button>
          </div>
        </form>
      </div>

      <!-- Success Modal -->
      @if (showSuccessModal()) {
      <div class="modal-overlay" (click)="closeSuccessModal()">
        <div class="modal-content" (click)="$event.stopPropagation()">
          <div class="modal-header success">
            <span class="material-icons modal-icon">check_circle</span>
            <h2>¡Comercio Creado Exitosamente!</h2>
          </div>
          <div class="modal-body">
            <p class="success-message">
              El comercio <strong>{{ createdTenant()?.slug }}</strong> ha sido
              creado correctamente.
            </p>

            @if (createdTenant()?.adminPassword) {
            <div class="credentials-box">
              <div class="credentials-header">
                <span class="material-icons">vpn_key</span>
                <h3>Credenciales de Administrador</h3>
              </div>
              <div class="credential-item">
                <label>Usuario</label>
                <div class="credential-value">
                  <code>admin&#64;{{ createdTenant()?.slug }}</code>
                  <button
                    class="btn-copy"
                    (click)="copyToClipboard('admin@' + createdTenant()?.slug)"
                    title="Copiar"
                  >
                    <span class="material-icons">content_copy</span>
                  </button>
                </div>
              </div>
              <div class="credential-item">
                <label>Contraseña Temporal</label>
                <div class="credential-value">
                  <code>{{ createdTenant()?.adminPassword }}</code>
                  <button
                    class="btn-copy"
                    (click)="copyToClipboard(createdTenant()?.adminPassword!)"
                    title="Copiar"
                  >
                    <span class="material-icons">content_copy</span>
                  </button>
                </div>
              </div>
              <div class="credentials-warning">
                <span class="material-icons">warning</span>
                <p>
                  <strong>¡Importante!</strong> Guarda estas credenciales. La
                  contraseña solo se muestra una vez.
                </p>
              </div>
            </div>
            }

            <div class="next-steps">
              <h4>
                <span class="material-icons">checklist</span>
                Próximos pasos
              </h4>
              <ol>
                <li>Guarda las credenciales de administrador</li>
                <li>
                  Accede con el tenant:
                  <code>?tenant={{ createdTenant()?.slug }}</code>
                </li>
                <li>Inicia sesión con las credenciales proporcionadas</li>
                <li>Cambia la contraseña por una segura</li>
              </ol>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" (click)="closeSuccessModal()">
              Cerrar
            </button>
            <button class="btn btn-primary" (click)="viewTenantDetails()">
              <span class="material-icons">visibility</span>
              Ver Detalles
            </button>
          </div>
        </div>
      </div>
      }
    </div>
  `,
  styles: [
    `
      .create-container {
        padding: 2rem;
        max-width: 900px;
        margin: 0 auto;
      }

      /* Header */
      .page-header {
        display: flex;
        align-items: flex-start;
        gap: 1rem;
        margin-bottom: 2rem;
      }

      .btn-back {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 40px;
        height: 40px;
        border: none;
        background: white;
        border-radius: 0.5rem;
        cursor: pointer;
        transition: all 0.2s;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      }

      .btn-back:hover {
        background: #f3f4f6;
        transform: translateX(-2px);
      }

      .header-content {
        flex: 1;
      }

      .page-title {
        font-size: 2rem;
        font-weight: 600;
        color: #1f2937;
        margin: 0 0 0.5rem 0;
      }

      .page-subtitle {
        color: #6b7280;
        margin: 0;
        font-size: 0.95rem;
      }

      /* Form Card */
      .form-card {
        background: white;
        border-radius: 0.75rem;
        padding: 2rem;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      }

      /* Form Groups */
      .form-group {
        margin-bottom: 2rem;
      }

      .form-label {
        display: block;
        font-size: 0.95rem;
        font-weight: 500;
        color: #374151;
        margin-bottom: 0.5rem;
      }

      .required {
        color: #ef4444;
      }

      .form-input {
        width: 100%;
        padding: 0.75rem 1rem;
        border: 1px solid #d1d5db;
        border-radius: 0.5rem;
        font-size: 1rem;
        transition: all 0.2s;
      }

      .form-input:focus {
        outline: none;
        border-color: #3b82f6;
        box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
      }

      .form-input.error {
        border-color: #ef4444;
      }

      .form-input.error:focus {
        box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
      }

      .form-hint {
        display: flex;
        align-items: flex-start;
        gap: 0.5rem;
        margin-top: 0.5rem;
        font-size: 0.875rem;
        color: #6b7280;
      }

      .hint-icon {
        font-size: 18px;
        flex-shrink: 0;
        margin-top: 1px;
      }

      .form-error {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        margin-top: 0.5rem;
        font-size: 0.875rem;
        color: #ef4444;
      }

      .form-error .material-icons {
        font-size: 18px;
      }

      /* Plan Cards */
      .plan-cards {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 1rem;
        margin-top: 0.5rem;
      }

      .plan-card {
        position: relative;
        padding: 1.5rem;
        border: 2px solid #e5e7eb;
        border-radius: 0.75rem;
        cursor: pointer;
        transition: all 0.2s;
        background: white;
      }

      .plan-card:hover {
        border-color: #d1d5db;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
      }

      .plan-card.selected {
        border-color: #3b82f6;
        background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
        box-shadow: 0 4px 12px rgba(59, 130, 246, 0.2);
      }

      .plan-card.premium.selected {
        border-color: #f59e0b;
        background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%);
        box-shadow: 0 4px 12px rgba(245, 158, 11, 0.2);
      }

      .plan-radio {
        position: absolute;
        opacity: 0;
        pointer-events: none;
      }

      .plan-content {
        text-align: center;
      }

      .plan-icon {
        font-size: 48px;
        color: #3b82f6;
        margin-bottom: 0.75rem;
      }

      .plan-card.premium .plan-icon {
        color: #f59e0b;
      }

      .plan-name {
        font-size: 1.25rem;
        font-weight: 600;
        color: #1f2937;
        margin: 0 0 0.5rem 0;
      }

      .plan-description {
        font-size: 0.875rem;
        color: #6b7280;
        margin: 0 0 1rem 0;
      }

      .plan-features {
        list-style: none;
        padding: 0;
        margin: 0;
        text-align: left;
      }

      .plan-features li {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.875rem;
        color: #374151;
        margin-bottom: 0.5rem;
      }

      .plan-features .material-icons {
        font-size: 18px;
        color: #10b981;
      }

      .plan-features li.more-features {
        color: #6b7280;
        font-style: italic;
      }

      .plan-features li.more-features .material-icons {
        color: #6b7280;
      }

      /* Loading plans */
      .loading-plans {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 3rem;
        gap: 1rem;
      }

      .loading-plans .spinner {
        width: 40px;
        height: 40px;
        border: 4px solid #e5e7eb;
        border-top-color: #3b82f6;
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
      }

      .loading-plans p {
        color: #6b7280;
        margin: 0;
      }

      @keyframes spin {
        to {
          transform: rotate(360deg);
        }
      }

      /* Alerts */
      .alert {
        display: flex;
        align-items: flex-start;
        gap: 1rem;
        padding: 1rem;
        border-radius: 0.5rem;
        margin-bottom: 1.5rem;
      }

      .alert-error {
        background: #fef2f2;
        border: 1px solid #fecaca;
        color: #991b1b;
      }

      .alert .material-icons {
        font-size: 24px;
      }

      .alert-content {
        flex: 1;
      }

      .alert-content strong {
        display: block;
        margin-bottom: 0.25rem;
      }

      .alert-content p {
        margin: 0;
        font-size: 0.95rem;
      }

      /* Actions */
      .form-actions {
        display: flex;
        gap: 1rem;
        justify-content: flex-end;
        padding-top: 1.5rem;
        border-top: 1px solid #e5e7eb;
      }

      .btn {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.75rem 1.5rem;
        border-radius: 0.5rem;
        font-weight: 500;
        font-size: 0.95rem;
        cursor: pointer;
        border: none;
        transition: all 0.2s;
      }

      .btn:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }

      .btn-secondary {
        background: white;
        color: #374151;
        border: 1px solid #d1d5db;
      }

      .btn-secondary:hover:not(:disabled) {
        background: #f9fafb;
        border-color: #9ca3af;
      }

      .btn-primary {
        background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
        color: white;
      }

      .btn-primary:hover:not(:disabled) {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
      }

      .spinner-small {
        width: 16px;
        height: 16px;
        border: 2px solid rgba(255, 255, 255, 0.3);
        border-top-color: white;
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
      }

      @keyframes spin {
        to {
          transform: rotate(360deg);
        }
      }

      /* Modal */
      .modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
        padding: 2rem;
      }

      .modal-content {
        background: white;
        border-radius: 1rem;
        max-width: 600px;
        width: 100%;
        max-height: 90vh;
        overflow-y: auto;
        box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
      }

      .modal-header {
        padding: 2rem 2rem 1rem;
        text-align: center;
      }

      .modal-header.success {
        background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
      }

      .modal-icon {
        font-size: 64px;
        color: #10b981;
        margin-bottom: 1rem;
      }

      .modal-header h2 {
        font-size: 1.5rem;
        font-weight: 600;
        color: #1f2937;
        margin: 0;
      }

      .modal-body {
        padding: 2rem;
      }

      .success-message {
        text-align: center;
        color: #374151;
        margin-bottom: 2rem;
      }

      .credentials-box {
        background: #f9fafb;
        border: 1px solid #e5e7eb;
        border-radius: 0.75rem;
        padding: 1.5rem;
        margin-bottom: 2rem;
      }

      .credentials-header {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        margin-bottom: 1rem;
        color: #374151;
      }

      .credentials-header .material-icons {
        font-size: 24px;
      }

      .credentials-header h3 {
        font-size: 1rem;
        font-weight: 600;
        margin: 0;
      }

      .credential-item {
        margin-bottom: 1rem;
      }

      .credential-item:last-of-type {
        margin-bottom: 0;
      }

      .credential-item label {
        display: block;
        font-size: 0.875rem;
        font-weight: 500;
        color: #6b7280;
        margin-bottom: 0.5rem;
      }

      .credential-value {
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }

      .credential-value code {
        flex: 1;
        padding: 0.75rem;
        background: white;
        border: 1px solid #d1d5db;
        border-radius: 0.375rem;
        font-family: 'Monaco', 'Courier New', monospace;
        font-size: 0.95rem;
        color: #1f2937;
      }

      .btn-copy {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 36px;
        height: 36px;
        border: 1px solid #d1d5db;
        background: white;
        border-radius: 0.375rem;
        cursor: pointer;
        transition: all 0.2s;
        color: #6b7280;
      }

      .btn-copy:hover {
        background: #f3f4f6;
        border-color: #9ca3af;
        color: #374151;
      }

      .btn-copy .material-icons {
        font-size: 18px;
      }

      .credentials-warning {
        display: flex;
        align-items: flex-start;
        gap: 0.75rem;
        margin-top: 1.5rem;
        padding: 1rem;
        background: #fef3c7;
        border: 1px solid #fde68a;
        border-radius: 0.5rem;
      }

      .credentials-warning .material-icons {
        font-size: 20px;
        color: #d97706;
        flex-shrink: 0;
      }

      .credentials-warning p {
        margin: 0;
        font-size: 0.875rem;
        color: #92400e;
      }

      .next-steps {
        background: #eff6ff;
        border: 1px solid #dbeafe;
        border-radius: 0.75rem;
        padding: 1.5rem;
      }

      .next-steps h4 {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 1rem;
        font-weight: 600;
        color: #1e40af;
        margin: 0 0 1rem 0;
      }

      .next-steps .material-icons {
        font-size: 20px;
      }

      .next-steps ol {
        margin: 0;
        padding-left: 1.5rem;
      }

      .next-steps li {
        color: #374151;
        font-size: 0.95rem;
        margin-bottom: 0.5rem;
      }

      .next-steps code {
        padding: 0.25rem 0.5rem;
        background: white;
        border: 1px solid #dbeafe;
        border-radius: 0.25rem;
        font-family: 'Monaco', 'Courier New', monospace;
        font-size: 0.875rem;
        color: #1e40af;
      }

      .modal-footer {
        display: flex;
        gap: 1rem;
        justify-content: flex-end;
        padding: 1.5rem 2rem 2rem;
        border-top: 1px solid #e5e7eb;
      }
    `,
  ],
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
  readonly showSuccessModal = signal(false);
  readonly plans = signal<Plan[]>([]);
  readonly createdTenant = signal<{
    slug: string;
    status: string;
    adminPassword?: string;
  } | null>(null);

  // Form
  readonly tenantForm: FormGroup;

  constructor() {
    this.tenantForm = this.fb.group({
      slug: [
        '',
        [
          Validators.required,
          Validators.minLength(3),
          Validators.maxLength(50),
          Validators.pattern(/^[a-z0-9-]+$/),
        ],
      ],
      name: [
        '',
        [
          Validators.required,
          Validators.minLength(3),
          Validators.maxLength(100),
        ],
      ],
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

    try {
      const response = await this.tenantService.createTenant(
        this.tenantForm.value
      );

      this.createdTenant.set(response);
      this.showSuccessModal.set(true);
      this.tenantForm.reset();
    } catch (err) {
      this.error.set(
        err instanceof Error
          ? err.message
          : 'Error al crear el tenant. Inténtalo de nuevo.'
      );
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

  viewTenantDetails(): void {
    const tenant = this.createdTenant();
    if (tenant) {
      this.showSuccessModal.set(false);
      // Aquí usaremos el slug para buscar el ID
      this.router.navigate(['/admin/tenants']);
    }
  }

  copyToClipboard(text: string): void {
    navigator.clipboard.writeText(text).then(
      () => {
        // Podrías agregar un toast notification aquí
        console.log('Copiado al portapapeles');
      },
      (err) => {
        console.error('Error al copiar:', err);
      }
    );
  }
}
