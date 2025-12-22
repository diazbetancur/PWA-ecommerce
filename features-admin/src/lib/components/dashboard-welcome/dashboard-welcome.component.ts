import { CommonModule } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { AuthService, TenantContextService } from '@pwa/core';

/**
 * 🎉 Pantalla de Bienvenida del Dashboard Tenant
 *
 * Primera pantalla que ve el usuario cuando ingresa al panel de administración del tenant.
 * Muestra información general y accesos rápidos.
 */
@Component({
  selector: 'app-dashboard-welcome',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="dashboard-welcome">
      <div class="welcome-header">
        <h1>¡Bienvenido al Panel de Administración!</h1>
        <p class="subtitle">{{ tenantName() }}</p>
      </div>

      <div class="welcome-cards">
        <!-- Card de Usuario -->
        <div class="welcome-card">
          <div class="card-icon">
            <span class="material-icons">person</span>
          </div>
          <div class="card-content">
            <h3>{{ userName() }}</h3>
            <p>{{ userRoles() }}</p>
          </div>
        </div>

        <!-- Card de Tenant -->
        <div class="welcome-card">
          <div class="card-icon">
            <span class="material-icons">storefront</span>
          </div>
          <div class="card-content">
            <h3>Tenant Activo</h3>
            <p>{{ tenantSlug() }}</p>
          </div>
        </div>

        <!-- Card de Módulos -->
        <div class="welcome-card">
          <div class="card-icon">
            <span class="material-icons">apps</span>
          </div>
          <div class="card-content">
            <h3>Módulos Disponibles</h3>
            <p>{{ modulesCount() }}</p>
          </div>
        </div>
      </div>

      <div class="quick-actions">
        <h2>Acciones Rápidas</h2>
        <div class="actions-grid">
          <button type="button" class="action-button">
            <span class="material-icons">inventory_2</span>
            <span>Gestionar Productos</span>
          </button>
          <button type="button" class="action-button">
            <span class="material-icons">shopping_cart</span>
            <span>Ver Ventas</span>
          </button>
          <button type="button" class="action-button">
            <span class="material-icons">analytics</span>
            <span>Ver Métricas</span>
          </button>
          <button type="button" class="action-button">
            <span class="material-icons">settings</span>
            <span>Configuración</span>
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .dashboard-welcome {
        padding: 2rem;
        max-width: 1200px;
        margin: 0 auto;
      }

      .welcome-header {
        text-align: center;
        margin-bottom: 3rem;
      }

      .welcome-header h1 {
        font-size: 2.5rem;
        color: #111827;
        margin: 0 0 0.5rem 0;
        font-weight: 700;
      }

      .subtitle {
        font-size: 1.25rem;
        color: #6b7280;
        margin: 0;
      }

      .welcome-cards {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
        gap: 1.5rem;
        margin-bottom: 3rem;
      }

      .welcome-card {
        background: white;
        border-radius: 12px;
        padding: 1.5rem;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        display: flex;
        align-items: center;
        gap: 1rem;
        transition: transform 0.2s, box-shadow 0.2s;
      }

      .welcome-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      }

      .card-icon {
        width: 64px;
        height: 64px;
        border-radius: 12px;
        background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
      }

      .card-icon .material-icons {
        font-size: 32px;
        color: white;
      }

      .card-content h3 {
        margin: 0 0 0.25rem 0;
        font-size: 1.125rem;
        color: #111827;
        font-weight: 600;
      }

      .card-content p {
        margin: 0;
        font-size: 0.875rem;
        color: #6b7280;
      }

      .quick-actions h2 {
        font-size: 1.5rem;
        color: #111827;
        margin: 0 0 1.5rem 0;
        font-weight: 600;
      }

      .actions-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 1rem;
      }

      .action-button {
        background: white;
        border: 2px solid #e5e7eb;
        border-radius: 12px;
        padding: 1.5rem;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.75rem;
        cursor: pointer;
        transition: all 0.2s;
        font-size: 1rem;
        color: #374151;
        font-weight: 500;
      }

      .action-button:hover {
        border-color: #3b82f6;
        background: #eff6ff;
        color: #2563eb;
        transform: translateY(-2px);
      }

      .action-button .material-icons {
        font-size: 32px;
      }

      @media (max-width: 768px) {
        .dashboard-welcome {
          padding: 1rem;
        }

        .welcome-header h1 {
          font-size: 1.75rem;
        }

        .welcome-cards {
          grid-template-columns: 1fr;
        }

        .actions-grid {
          grid-template-columns: repeat(2, 1fr);
        }
      }
    `,
  ],
})
export class DashboardWelcomeComponent {
  private readonly authService = inject(AuthService);
  private readonly tenantContext = inject(TenantContextService);

  readonly userName = computed(() => {
    const claims = this.authService.claims;
    return claims?.email?.split('@')[0] || 'Usuario';
  });

  readonly userRoles = computed(() => {
    const claims = this.authService.claims;
    const roles = claims?.roles || [];
    return roles.length > 0 ? roles.join(', ') : 'Sin roles';
  });

  readonly tenantName = computed(() => {
    return this.tenantContext.tenantDisplayName() || 'Tenant';
  });

  readonly tenantSlug = computed(() => {
    return this.tenantContext.tenantSlug() || 'No disponible';
  });

  readonly modulesCount = computed(() => {
    const claims = this.authService.claims;
    const modules = claims?.modules || [];
    if (modules.length === 0) {
      return 'Todos los módulos';
    }
    return `${modules.length} módulos`;
  });
}
