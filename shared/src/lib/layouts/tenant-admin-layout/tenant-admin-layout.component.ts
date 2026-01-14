import { CommonModule } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { TenantAdminMenuService, TenantContextService } from '@pwa/core';
import { TenantAdminMenuComponent } from '../../components/tenant-admin-menu/tenant-admin-menu.component';

/**
 * 🏗️ Layout Principal para Panel Administrativo del Tenant
 *
 * Este layout se usa cuando el usuario es un administrador del tenant
 * (userType = 'tenant_user' con roles Admin/Manager).
 *
 * Incluye:
 * - Menú lateral dinámico basado en permisos
 * - Header con información del tenant y usuario
 * - Área de contenido principal para las rutas hijas
 */
@Component({
  selector: 'app-tenant-admin-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, TenantAdminMenuComponent],
  template: `
    <div class="admin-layout">
      <!-- Menú Lateral -->
      <aside class="admin-sidebar">
        <app-tenant-admin-menu></app-tenant-admin-menu>
      </aside>

      <!-- Contenido Principal -->
      <div class="admin-main">
        <!-- Header -->
        <header class="admin-header">
          <div class="header-left">
            <h1 class="page-title">Panel Administrativo</h1>
            <p class="tenant-name">{{ tenantName() }}</p>
          </div>

          <div class="header-right">
            <!-- Indicador de Tenant Activo -->
            <div class="tenant-badge">
              <span class="material-icons">storefront</span>
              <span>{{ tenantSlug() }}</span>
            </div>

            <!-- Notificaciones (placeholder) -->
            <button type="button" class="icon-button" title="Notificaciones">
              <span class="material-icons">notifications</span>
            </button>

            <!-- Perfil (placeholder) -->
            <button type="button" class="icon-button" title="Perfil">
              <span class="material-icons">account_circle</span>
            </button>
          </div>
        </header>

        <!-- Contenido de las Rutas -->
        <main class="admin-content">
          <router-outlet></router-outlet>
        </main>

        <!-- Footer -->
        <footer class="admin-footer">
          <p>
            PWA eCommerce Admin Panel - {{ tenantName() }} © {{ currentYear }}
          </p>
        </footer>
      </div>
    </div>
  `,
  styles: [
    `
      .admin-layout {
        display: flex;
        height: 100vh;
        overflow: hidden;
        background: #f9fafb;
      }

      /* Sidebar */
      .admin-sidebar {
        flex-shrink: 0;
        height: 100%;
        overflow-y: auto;
        background: #fff;
        box-shadow: 2px 0 8px rgba(0, 0, 0, 0.05);
      }

      /* Main Content Area */
      .admin-main {
        flex: 1;
        display: flex;
        flex-direction: column;
        height: 100vh;
        overflow: hidden;
      }

      /* Header */
      .admin-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 1rem 2rem;
        background: #fff;
        border-bottom: 1px solid #e5e7eb;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
      }

      .header-left {
        flex: 1;
      }

      .page-title {
        margin: 0;
        font-size: 1.5rem;
        font-weight: 600;
        color: #111827;
      }

      .tenant-name {
        margin: 0.25rem 0 0 0;
        font-size: 0.875rem;
        color: #6b7280;
      }

      .header-right {
        display: flex;
        align-items: center;
        gap: 1rem;
      }

      .tenant-badge {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.5rem 1rem;
        background: #eff6ff;
        color: #1e40af;
        border-radius: 9999px;
        font-size: 0.875rem;
        font-weight: 500;
      }

      .tenant-badge .material-icons {
        font-size: 18px;
      }

      .icon-button {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 40px;
        height: 40px;
        border: none;
        background: transparent;
        color: #6b7280;
        border-radius: 50%;
        cursor: pointer;
        transition: all 0.2s;
      }

      .icon-button:hover {
        background: #f3f4f6;
        color: #111827;
      }

      .icon-button .material-icons {
        font-size: 24px;
      }

      /* Content */
      .admin-content {
        flex: 1;
        overflow-y: auto;
        padding: 2rem;
      }

      /* Footer */
      .admin-footer {
        padding: 1rem 2rem;
        border-top: 1px solid #e5e7eb;
        background: #fff;
        text-align: center;
      }

      .admin-footer p {
        margin: 0;
        font-size: 0.875rem;
        color: #6b7280;
      }

      /* Responsive */
      @media (max-width: 768px) {
        .admin-layout {
          flex-direction: column;
        }

        .admin-sidebar {
          position: fixed;
          left: 0;
          top: 0;
          width: 280px;
          height: 100vh;
          z-index: 1000;
          transform: translateX(-100%);
          transition: transform 0.3s;
        }

        .admin-sidebar.open {
          transform: translateX(0);
        }

        .admin-header {
          padding: 1rem;
        }

        .page-title {
          font-size: 1.25rem;
        }

        .tenant-badge {
          display: none;
        }

        .admin-content {
          padding: 1rem;
        }
      }
    `,
  ],
})
export class TenantAdminLayoutComponent {
  private readonly tenantContext = inject(TenantContextService);
  private readonly menuService = inject(TenantAdminMenuService);

  readonly tenantName = computed(
    () => this.tenantContext.currentTenant()?.displayName || 'Mi Tienda'
  );

  readonly tenantSlug = computed(
    () => this.tenantContext.getTenantSlug() || 'unknown'
  );

  readonly currentYear = new Date().getFullYear();

  // Para desarrollo: verificar que el usuario es admin
  constructor() {
    // Layout initialized
  }
}
