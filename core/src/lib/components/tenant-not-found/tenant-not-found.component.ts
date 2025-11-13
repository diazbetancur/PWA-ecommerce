import { Component, inject, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TenantBootstrapService } from '@pwa/core';

@Component({
  selector: 'app-tenant-not-found',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="tenant-error-container">
      <div class="tenant-error-content">
        <!-- Icon -->
        <div class="error-icon">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <path d="M12 8v4"/>
            <path d="M12 16h.01"/>
          </svg>
        </div>

        <!-- Error Message -->
        <div class="error-message">
          <h1 class="error-title">{{ errorTitle() }}</h1>
          <p class="error-description">{{ errorDescription() }}</p>

          @if (attemptedSlug(); as slug) {
            <div class="attempted-slug">
              <strong>Tenant solicitado:</strong>
              <code>{{ slug }}</code>
            </div>
          }
        </div>

        <!-- Actions -->
        <div class="error-actions">
          <!-- Quick Tenant Switcher -->
          <div class="tenant-switcher">
            <label for="tenant-input" class="switcher-label">
              Cambiar a otro tenant:
            </label>
            <div class="switcher-input-group">
              <input
                id="tenant-input"
                type="text"
                [(ngModel)]="newTenantSlug"
                placeholder="Ingresa el slug del tenant"
                class="tenant-input"
                (keyup.enter)="changeTenant()"
                [disabled]="isChangingTenant()"
              />
              <button
                type="button"
                class="btn btn-primary"
                (click)="changeTenant()"
                [disabled]="!newTenantSlug().trim() || isChangingTenant()"
              >
                @if (isChangingTenant()) {
                  <span class="loading-spinner"></span>
                  Cambiando...
                } @else {
                  Cambiar Tenant
                }
              </button>
            </div>
          </div>

          <!-- Quick Actions -->
          <div class="quick-actions">
            <button
              type="button"
              class="btn btn-secondary"
              (click)="retryCurrentTenant()"
              [disabled]="isRetrying()"
            >
              @if (isRetrying()) {
                <span class="loading-spinner"></span>
                Reintentando...
              } @else {
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <polyline points="23 4 23 10 17 10"/>
                  <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
                </svg>
                Reintentar
              }
            </button>

            <button
              type="button"
              class="btn btn-outline"
              (click)="goToDefault()"
            >
              Ir al Tenant Por Defecto
            </button>

            <button
              type="button"
              class="btn btn-outline"
              (click)="goToHome()"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
                <polyline points="9,22 9,12 15,12 15,22"/>
              </svg>
              Inicio
            </button>
          </div>

          <!-- Suggested Tenants -->
          @if (suggestedTenants().length > 0) {
            <div class="suggested-tenants">
              <h3>Tenants disponibles:</h3>
              <div class="tenant-buttons">
                @for (tenant of suggestedTenants(); track tenant) {
                  <button
                    type="button"
                    class="btn-tenant-suggestion"
                    (click)="selectSuggestedTenant(tenant)"
                    [disabled]="isChangingTenant()"
                  >
                    {{ tenant }}
                  </button>
                }
              </div>
            </div>
          }
        </div>

        <!-- Error Details (Development) -->
        @if (showErrorDetails()) {
          <details class="error-details">
            <summary>Detalles técnicos</summary>
            <div class="error-info">
              <div class="error-field">
                <strong>Código:</strong> {{ currentError()?.code }}
              </div>
              <div class="error-field">
                <strong>Timestamp:</strong> {{ currentError()?.timestamp | date:'medium' }}
              </div>
              <div class="error-field">
                <strong>URL actual:</strong> {{ currentUrl() }}
              </div>
              @if (currentError()?.slug) {
                <div class="error-field">
                  <strong>Slug intentado:</strong> {{ currentError()?.slug }}
                </div>
              }
            </div>
          </details>
        }

        <!-- Help Text -->
        <div class="help-text">
          <p>
            <strong>¿Necesitas ayuda?</strong><br>
            Verifica que el slug del tenant sea correcto o contacta al administrador del sistema.
          </p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .tenant-error-container {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 2rem 1rem;
      background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }

    .tenant-error-content {
      max-width: 600px;
      width: 100%;
      background: white;
      border-radius: 12px;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
      padding: 3rem 2rem;
      text-align: center;
    }

    .error-icon {
      color: #ef4444;
      margin-bottom: 2rem;
    }

    .error-title {
      font-size: 2rem;
      font-weight: 700;
      color: #1f2937;
      margin: 0 0 1rem 0;
    }

    .error-description {
      font-size: 1.125rem;
      color: #6b7280;
      margin: 0 0 1.5rem 0;
      line-height: 1.6;
    }

    .attempted-slug {
      background: #f3f4f6;
      border-radius: 8px;
      padding: 1rem;
      margin-bottom: 2rem;
      text-align: left;
      color: #374151;
    }

    .attempted-slug code {
      background: #1f2937;
      color: #f9fafb;
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
      font-family: 'Monaco', 'Consolas', monospace;
      font-size: 0.875rem;
    }

    .error-actions {
      display: flex;
      flex-direction: column;
      gap: 2rem;
      text-align: left;
    }

    .tenant-switcher {
      background: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 1.5rem;
    }

    .switcher-label {
      display: block;
      font-weight: 600;
      color: #374151;
      margin-bottom: 0.75rem;
    }

    .switcher-input-group {
      display: flex;
      gap: 0.75rem;
    }

    .tenant-input {
      flex: 1;
      padding: 0.75rem;
      border: 1px solid #d1d5db;
      border-radius: 6px;
      font-size: 0.875rem;
      transition: all 0.2s ease;
    }

    .tenant-input:focus {
      outline: none;
      border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }

    .tenant-input:disabled {
      background: #f3f4f6;
      opacity: 0.6;
    }

    .quick-actions {
      display: flex;
      flex-wrap: wrap;
      gap: 0.75rem;
      justify-content: center;
    }

    .btn {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1.5rem;
      border-radius: 6px;
      font-weight: 500;
      font-size: 0.875rem;
      cursor: pointer;
      transition: all 0.2s ease;
      text-decoration: none;
      border: 1px solid transparent;
    }

    .btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .btn-primary {
      background: #3b82f6;
      color: white;
      border-color: #3b82f6;
    }

    .btn-primary:hover:not(:disabled) {
      background: #2563eb;
      border-color: #2563eb;
    }

    .btn-secondary {
      background: #6b7280;
      color: white;
      border-color: #6b7280;
    }

    .btn-secondary:hover:not(:disabled) {
      background: #4b5563;
      border-color: #4b5563;
    }

    .btn-outline {
      background: transparent;
      color: #374151;
      border-color: #d1d5db;
    }

    .btn-outline:hover:not(:disabled) {
      background: #f3f4f6;
      border-color: #9ca3af;
    }

    .suggested-tenants {
      background: #eff6ff;
      border: 1px solid #dbeafe;
      border-radius: 8px;
      padding: 1.5rem;
    }

    .suggested-tenants h3 {
      margin: 0 0 1rem 0;
      color: #1e40af;
      font-size: 1rem;
    }

    .tenant-buttons {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
    }

    .btn-tenant-suggestion {
      background: #3b82f6;
      color: white;
      border: none;
      padding: 0.5rem 1rem;
      border-radius: 6px;
      font-size: 0.875rem;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .btn-tenant-suggestion:hover:not(:disabled) {
      background: #2563eb;
    }

    .btn-tenant-suggestion:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .loading-spinner {
      display: inline-block;
      width: 14px;
      height: 14px;
      border: 2px solid transparent;
      border-top: 2px solid currentColor;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .error-details {
      margin-top: 2rem;
      text-align: left;
      background: #fef2f2;
      border: 1px solid #fecaca;
      border-radius: 6px;
      padding: 1rem;
    }

    .error-details summary {
      cursor: pointer;
      font-weight: 600;
      color: #dc2626;
      margin-bottom: 1rem;
    }

    .error-info {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .error-field {
      font-size: 0.875rem;
      color: #374151;
    }

    .help-text {
      margin-top: 2rem;
      padding-top: 2rem;
      border-top: 1px solid #e5e7eb;
      font-size: 0.875rem;
      color: #6b7280;
    }

    /* Responsive */
    @media (max-width: 640px) {
      .tenant-error-content {
        padding: 2rem 1.5rem;
      }

      .error-title {
        font-size: 1.5rem;
      }

      .switcher-input-group {
        flex-direction: column;
      }

      .quick-actions {
        flex-direction: column;
      }

      .btn {
        justify-content: center;
      }
    }
  `]
})
export class TenantNotFoundComponent {
  private readonly tenantBootstrap = inject(TenantBootstrapService);
  private readonly router = inject(Router);

  // Reactive state
  newTenantSlug = signal('');
  isChangingTenant = signal(false);
  isRetrying = signal(false);

  // Computed properties
  currentError = computed(() => this.tenantBootstrap.tenantError());
  attemptedSlug = computed(() => this.tenantBootstrap.attemptedSlug());

  errorTitle = computed(() => {
    const error = this.currentError();
    switch (error?.code) {
      case 'NOT_FOUND':
        return 'Tenant No Encontrado';
      case 'NETWORK_ERROR':
        return 'Error de Conexión';
      case 'INVALID_CONFIG':
        return 'Configuración Inválida';
      default:
        return 'Error del Sistema';
    }
  });

  errorDescription = computed(() => {
    const error = this.currentError();
    return error?.message || 'Ha ocurrido un error inesperado al cargar el tenant.';
  });

  suggestedTenants = computed(() => {
    // En producción, estos podrían venir del backend
    return ['demo-a', 'demo-b', 'demo-c', 'default'];
  });

  showErrorDetails = computed(() => {
    // Solo mostrar en desarrollo
    return !this.isProduction();
  });

  currentUrl = computed(() => {
    return globalThis.location.href;
  });

  /**
   * Cambia al tenant especificado
   */
  async changeTenant(): Promise<void> {
    const slug = this.newTenantSlug().trim();
    if (!slug) return;

    this.isChangingTenant.set(true);

    try {
      await this.tenantBootstrap.retryTenantLoad(slug);
    } catch (error) {
      console.error('Error changing tenant:', error);
      // El error será manejado por el TenantBootstrapService
    } finally {
      this.isChangingTenant.set(false);
    }
  }

  /**
   * Selecciona un tenant sugerido
   */
  async selectSuggestedTenant(slug: string): Promise<void> {
    this.newTenantSlug.set(slug);
    await this.changeTenant();
  }

  /**
   * Reintenta cargar el tenant actual
   */
  async retryCurrentTenant(): Promise<void> {
    this.isRetrying.set(true);

    try {
      await this.tenantBootstrap.retryTenantLoad();
    } catch (error) {
      console.error('Error retrying tenant:', error);
    } finally {
      this.isRetrying.set(false);
    }
  }

  /**
   * Va al tenant por defecto
   */
  goToDefault(): void {
    const url = new URL(globalThis.location.href);
    url.searchParams.delete('tenant'); // Remove tenant param to use default
    globalThis.location.href = url.toString();
  }

  /**
   * Va a la página de inicio
   */
  async goToHome(): Promise<void> {
    await this.router.navigate(['/']);
  }

  /**
   * Detecta si estamos en producción
   */
  private isProduction(): boolean {
    return !globalThis.location.hostname.includes('localhost') &&
           !globalThis.location.hostname.includes('127.0.0.1');
  }
}
