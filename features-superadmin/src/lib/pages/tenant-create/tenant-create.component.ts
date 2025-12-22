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
            Registra un nuevo comercio con su base de datos y configuración
            inicial
          </p>
        </div>
      </div>

      <!-- Form Card -->
      <div class="form-card">
        <form [formGroup]="tenantForm" (ngSubmit)="onSubmit()">
          <!-- Nombre del Comercio -->
          <div class="form-group">
            <label class="form-label" for="name">
              Nombre del Comercio <span class="required">*</span>
            </label>
            <input
              id="name"
              type="text"
              class="form-input"
              formControlName="name"
              placeholder="Ej: Mi Tienda Online"
              [class.error]="isFieldInvalid('name')"
              (input)="onNameChange()"
            />
            <p class="form-hint">
              <span class="material-icons hint-icon">info</span>
              Nombre visible de la tienda que verán los clientes
            </p>
            @if (isFieldInvalid('name')) {
            <p class="form-error">
              <span class="material-icons">error</span>
              @if (tenantForm.get('name')?.hasError('required')) { El nombre del
              comercio es requerido } @else if
              (tenantForm.get('name')?.hasError('minlength')) { Mínimo 3
              caracteres } @else if
              (tenantForm.get('name')?.hasError('maxlength')) { Máximo 100
              caracteres }
            </p>
            }
          </div>

          <!-- Identificador (Slug) - Solo lectura, generado automáticamente -->
          <div class="form-group">
            <label class="form-label" for="slug">
              Identificador del Comercio
              <span class="badge-auto">Automático</span>
            </label>
            <div class="slug-preview">
              <span class="slug-prefix">URL:</span>
              <code class="slug-value">{{
                tenantForm.get('slug')?.value || 'nombre-del-comercio'
              }}</code>
            </div>
            <p class="form-hint">
              <span class="material-icons hint-icon">link</span>
              Este identificador se usa en la URL para acceder a tu comercio. Se
              genera automáticamente del nombre.
            </p>
          </div>

          <!-- Email del Administrador -->
          <div class="form-group">
            <label class="form-label" for="adminEmail">
              Email del Administrador <span class="required">*</span>
            </label>
            <input
              id="adminEmail"
              type="email"
              class="form-input"
              formControlName="adminEmail"
              placeholder="admin@micomercio.com"
              [class.error]="isFieldInvalid('adminEmail')"
            />
            <p class="form-hint">
              <span class="material-icons hint-icon">person</span>
              Este email se usará para el acceso del administrador del comercio
            </p>
            @if (isFieldInvalid('adminEmail')) {
            <p class="form-error">
              <span class="material-icons">error</span>
              @if (tenantForm.get('adminEmail')?.hasError('required')) { El
              email del administrador es requerido } @else if
              (tenantForm.get('adminEmail')?.hasError('invalidEmailFormat')) {
              Ingresa un email válido (ej: usuario&#64;dominio.com) }
            </p>
            }
          </div>

          <!-- Plan -->
          <div class="form-group">
            <label class="form-label">
              Plan del Comercio <span class="required">*</span>
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
              Selecciona un plan para el comercio
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
              @if (errorSuggestion()) {
              <p class="error-suggestion">
                <span class="material-icons">lightbulb</span>
                {{ errorSuggestion() }}
              </p>
              }
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
              <span class="material-icons">add_business</span>
              Crear Comercio }
            </button>
          </div>
        </form>
      </div>

      <!-- Success Modal -->
      @if (showSuccessModal()) {
      <div class="modal-overlay" (click)="closeSuccessModal()">
        <div
          class="modal-content success-modal"
          (click)="$event.stopPropagation()"
        >
          <div class="modal-header success">
            <span class="material-icons modal-icon">check_circle</span>
            <h2>¡Comercio Creado Exitosamente!</h2>
          </div>
          <div class="modal-body">
            <!-- Mensaje del backend -->
            @if (createdTenant()?.message) {
            <div class="success-message">
              <span class="material-icons">info</span>
              <p>{{ createdTenant()?.message }}</p>
            </div>
            }

            <!-- Datos del Comercio -->
            <div class="info-section">
              <h4>
                <span class="material-icons">storefront</span>
                Datos del Comercio
              </h4>
              <div class="info-grid">
                <div class="info-item">
                  <label>Identificador</label>
                  <code>{{ createdTenant()?.slug }}</code>
                </div>
                <div class="info-item">
                  <label>Estado</label>
                  <span class="badge-status">{{
                    createdTenant()?.status
                  }}</span>
                </div>
              </div>
            </div>

            <!-- Credenciales del Administrador -->
            @if (createdTenant()?.temporaryPassword) {
            <div class="credentials-section">
              <h4>
                <span class="material-icons">vpn_key</span>
                Credenciales del Administrador
              </h4>

              <div class="credential-item">
                <label>Email</label>
                <div class="credential-value">
                  <code>{{ createdTenant()?.adminEmail }}</code>
                  <button
                    class="btn-copy"
                    (click)="copyToClipboard(createdTenant()?.adminEmail!)"
                    title="Copiar"
                  >
                    <span class="material-icons">content_copy</span>
                  </button>
                </div>
              </div>

              <div class="credential-item">
                <label>Contraseña Temporal</label>
                <div class="credential-value">
                  <code class="password">{{
                    createdTenant()?.temporaryPassword
                  }}</code>
                  <button
                    class="btn-copy"
                    (click)="
                      copyToClipboard(createdTenant()?.temporaryPassword!)
                    "
                    title="Copiar"
                  >
                    <span class="material-icons">content_copy</span>
                  </button>
                </div>
              </div>

              <div class="credentials-warning">
                <span class="material-icons">warning</span>
                <div>
                  <strong>¡Importante!</strong>
                  <p>
                    Guarda estas credenciales en un lugar seguro. La contraseña
                    temporal solo se muestra una vez y debe ser cambiada en el
                    primer inicio de sesión.
                  </p>
                </div>
              </div>
            </div>
            }

            <!-- Acceso Directo -->
            <div class="access-section">
              <h4>
                <span class="material-icons">link</span>
                Acceso al Comercio
              </h4>
              <div class="access-url">
                <code>{{ getAccessUrl() }}</code>
                <button
                  class="btn-copy"
                  (click)="copyToClipboard(getAccessUrl())"
                  title="Copiar URL"
                >
                  <span class="material-icons">content_copy</span>
                </button>
              </div>
            </div>

            <!-- Próximos Pasos -->
            <div class="next-steps">
              <h4>
                <span class="material-icons">checklist</span>
                Próximos pasos
              </h4>
              <ol>
                <li>Guarda las credenciales del administrador</li>
                <li>Accede usando la URL del comercio</li>
                <li>Inicia sesión con el email y contraseña proporcionados</li>
                <li>Cambia la contraseña temporal por una segura</li>
              </ol>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" (click)="closeSuccessModal()">
              Cerrar
            </button>
            <button class="btn btn-primary" (click)="openAccessUrl()">
              <span class="material-icons">open_in_new</span>
              Ir al Comercio
            </button>
          </div>
        </div>
      </div>
      }

      <!-- Copied Toast -->
      @if (showCopiedToast()) {
      <div class="toast-copied">
        <span class="material-icons">check</span>
        Copiado al portapapeles
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
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.95rem;
        font-weight: 500;
        color: #374151;
        margin-bottom: 0.5rem;
      }

      .required {
        color: #ef4444;
      }

      .badge-auto {
        font-size: 0.7rem;
        padding: 0.15rem 0.5rem;
        background: #e0e7ff;
        color: #4f46e5;
        border-radius: 1rem;
        font-weight: 500;
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

      /* Slug Preview */
      .slug-preview {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.75rem 1rem;
        background: #f9fafb;
        border: 1px solid #e5e7eb;
        border-radius: 0.5rem;
      }

      .slug-prefix {
        font-size: 0.875rem;
        color: #6b7280;
      }

      .slug-value {
        font-family: 'Monaco', 'Menlo', monospace;
        font-size: 0.95rem;
        color: #3b82f6;
        background: transparent;
        padding: 0;
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

      .alert-warning {
        background: #fffbeb;
        border: 1px solid #fcd34d;
        color: #92400e;
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

      .error-suggestion {
        display: flex;
        align-items: flex-start;
        gap: 0.5rem;
        margin-top: 0.75rem !important;
        padding: 0.5rem 0.75rem;
        background: rgba(255, 255, 255, 0.5);
        border-radius: 0.375rem;
        font-size: 0.875rem;
        color: #92400e;
      }

      .error-suggestion .material-icons {
        font-size: 18px;
        flex-shrink: 0;
        color: #f59e0b;
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

      .btn-primary {
        background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
        color: white;
      }

      .btn-primary:hover:not(:disabled) {
        box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
        transform: translateY(-1px);
      }

      .btn-secondary {
        background: #f3f4f6;
        color: #374151;
      }

      .btn-secondary:hover:not(:disabled) {
        background: #e5e7eb;
      }

      .spinner-small {
        width: 18px;
        height: 18px;
        border: 2px solid rgba(255, 255, 255, 0.3);
        border-top-color: white;
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
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
        padding: 1rem;
        animation: fadeIn 0.2s ease-out;
      }

      @keyframes fadeIn {
        from {
          opacity: 0;
        }
        to {
          opacity: 1;
        }
      }

      .modal-content {
        background: white;
        border-radius: 1rem;
        max-width: 600px;
        width: 100%;
        max-height: 90vh;
        overflow-y: auto;
        animation: slideUp 0.3s ease-out;
      }

      .success-modal {
        max-width: 650px;
      }

      @keyframes slideUp {
        from {
          opacity: 0;
          transform: translateY(20px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      .modal-header {
        padding: 1.5rem 2rem;
        text-align: center;
        border-bottom: 1px solid #e5e7eb;
      }

      .modal-header.success {
        background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);
      }

      .modal-icon {
        font-size: 48px;
        color: #10b981;
        margin-bottom: 0.5rem;
      }

      .modal-header h2 {
        margin: 0;
        font-size: 1.5rem;
        color: #065f46;
      }

      .modal-body {
        padding: 1.5rem 2rem;
      }

      /* Info Section */
      .info-section,
      .credentials-section,
      .access-section,
      .next-steps {
        margin-bottom: 1.5rem;
      }

      .info-section h4,
      .credentials-section h4,
      .access-section h4,
      .next-steps h4 {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 1rem;
        color: #374151;
        margin: 0 0 1rem 0;
        padding-bottom: 0.5rem;
        border-bottom: 1px solid #e5e7eb;
      }

      .info-section h4 .material-icons,
      .credentials-section h4 .material-icons,
      .access-section h4 .material-icons,
      .next-steps h4 .material-icons {
        color: #6b7280;
        font-size: 20px;
      }

      .info-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 1rem;
      }

      .info-item {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
      }

      .info-item label {
        font-size: 0.75rem;
        color: #6b7280;
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }

      .info-item span,
      .info-item code {
        font-size: 0.95rem;
        color: #1f2937;
      }

      .info-item code {
        font-family: 'Monaco', 'Menlo', monospace;
        color: #3b82f6;
      }

      .badge-plan {
        display: inline-block;
        padding: 0.25rem 0.75rem;
        background: #dbeafe;
        color: #1d4ed8;
        border-radius: 1rem;
        font-size: 0.875rem;
        font-weight: 500;
      }

      .badge-status {
        display: inline-block;
        padding: 0.25rem 0.75rem;
        background: #d1fae5;
        color: #065f46;
        border-radius: 1rem;
        font-size: 0.875rem;
        font-weight: 500;
      }

      /* Success Message */
      .success-message {
        display: flex;
        align-items: flex-start;
        gap: 0.75rem;
        padding: 1rem;
        background: #ecfdf5;
        border: 1px solid #a7f3d0;
        border-radius: 0.75rem;
        margin-bottom: 1.5rem;
      }

      .success-message .material-icons {
        color: #059669;
        flex-shrink: 0;
      }

      .success-message p {
        margin: 0;
        color: #065f46;
        font-size: 0.95rem;
        line-height: 1.5;
      }

      /* Credentials Section */
      .credentials-section {
        background: #fefce8;
        border: 1px solid #fef08a;
        border-radius: 0.75rem;
        padding: 1rem;
      }

      .credentials-section h4 {
        border-bottom-color: #fef08a;
      }

      .credential-item {
        margin-bottom: 1rem;
      }

      .credential-item:last-of-type {
        margin-bottom: 0;
      }

      .credential-item label {
        display: block;
        font-size: 0.75rem;
        color: #6b7280;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        margin-bottom: 0.25rem;
      }

      .credential-value {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.5rem 0.75rem;
        background: white;
        border: 1px solid #e5e7eb;
        border-radius: 0.5rem;
      }

      .credential-value code {
        flex: 1;
        font-family: 'Monaco', 'Menlo', monospace;
        font-size: 0.95rem;
        color: #1f2937;
      }

      .credential-value code.password {
        color: #dc2626;
        font-weight: 600;
      }

      .btn-copy {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 32px;
        height: 32px;
        border: none;
        background: #f3f4f6;
        border-radius: 0.375rem;
        cursor: pointer;
        transition: all 0.2s;
      }

      .btn-copy:hover {
        background: #e5e7eb;
      }

      .btn-copy .material-icons {
        font-size: 18px;
        color: #6b7280;
      }

      .credentials-warning {
        display: flex;
        align-items: flex-start;
        gap: 0.75rem;
        margin-top: 1rem;
        padding: 0.75rem;
        background: #fef3c7;
        border-radius: 0.5rem;
      }

      .credentials-warning .material-icons {
        color: #d97706;
        font-size: 20px;
        flex-shrink: 0;
      }

      .credentials-warning strong {
        display: block;
        color: #92400e;
        font-size: 0.875rem;
      }

      .credentials-warning p {
        margin: 0.25rem 0 0 0;
        font-size: 0.825rem;
        color: #78350f;
      }

      /* Access Section */
      .access-url {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.75rem 1rem;
        background: #f9fafb;
        border: 1px solid #e5e7eb;
        border-radius: 0.5rem;
      }

      .access-url code {
        flex: 1;
        font-family: 'Monaco', 'Menlo', monospace;
        font-size: 0.875rem;
        color: #3b82f6;
        word-break: break-all;
      }

      /* Next Steps */
      .next-steps ol {
        margin: 0;
        padding-left: 1.25rem;
      }

      .next-steps li {
        font-size: 0.95rem;
        color: #374151;
        margin-bottom: 0.5rem;
      }

      .next-steps li:last-child {
        margin-bottom: 0;
      }

      .modal-footer {
        display: flex;
        gap: 1rem;
        justify-content: flex-end;
        padding: 1rem 2rem;
        border-top: 1px solid #e5e7eb;
        background: #f9fafb;
        border-radius: 0 0 1rem 1rem;
      }

      /* Toast */
      .toast-copied {
        position: fixed;
        bottom: 2rem;
        left: 50%;
        transform: translateX(-50%);
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.75rem 1.5rem;
        background: #1f2937;
        color: white;
        border-radius: 0.5rem;
        font-size: 0.95rem;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        animation: toastIn 0.3s ease-out;
        z-index: 1100;
      }

      .toast-copied .material-icons {
        font-size: 18px;
        color: #10b981;
      }

      @keyframes toastIn {
        from {
          opacity: 0;
          transform: translateX(-50%) translateY(20px);
        }
        to {
          opacity: 1;
          transform: translateX(-50%) translateY(0);
        }
      }

      /* Responsive */
      @media (max-width: 640px) {
        .create-container {
          padding: 1rem;
        }

        .form-card {
          padding: 1.5rem;
        }

        .plan-cards {
          grid-template-columns: 1fr;
        }

        .info-grid {
          grid-template-columns: 1fr;
        }

        .modal-content {
          margin: 0.5rem;
        }

        .modal-body {
          padding: 1rem;
        }

        .modal-footer {
          flex-direction: column;
        }

        .modal-footer .btn {
          width: 100%;
          justify-content: center;
        }
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
