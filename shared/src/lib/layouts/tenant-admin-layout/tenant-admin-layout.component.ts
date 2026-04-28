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
  templateUrl: './tenant-admin-layout.component.html',
  styleUrl: './tenant-admin-layout.component.scss',
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
