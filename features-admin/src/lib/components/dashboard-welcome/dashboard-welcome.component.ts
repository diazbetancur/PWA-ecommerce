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
  templateUrl: './dashboard-welcome.component.html',
  styleUrl: './dashboard-welcome.component.scss',
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
