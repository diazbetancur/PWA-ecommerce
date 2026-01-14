import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { AuthService, TenantAdminMenuService } from '@pwa/core';

/**
 * 🎯 Componente del Menú de Administración del Tenant
 *
 * Muestra el menú lateral dinámico basado en los permisos del usuario.
 * Este es para administradores DE UN TENANT (no SuperAdmin).
 *
 * Los clientes (customers) NO ven este menú.
 */
@Component({
  selector: 'app-tenant-admin-menu',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './tenant-admin-menu.component.html',
  styleUrl: './tenant-admin-menu.component.scss',
})
export class TenantAdminMenuComponent {
  private readonly authService = inject(AuthService);
  private readonly menuService = inject(TenantAdminMenuService);
  private readonly router = inject(Router);

  // Signal para controlar qué grupos están expandidos
  private readonly expandedGroups = signal<Set<string>>(
    new Set(['catalog', 'settings'])
  );

  constructor() {
    // Component initialized
  }

  // Computed signals
  readonly menuItems = computed(() => {
    const items = this.menuService.menu();
    return items;
  });

  readonly userName = computed(() => {
    const claims = this.authService.claims;
    return claims?.email || 'Usuario';
  });

  readonly userRole = computed(() => {
    const claims = this.authService.claims;
    const roles = claims?.roles || [];
    return roles.length > 0 ? roles.join(', ') : 'Usuario';
  });

  readonly userInitials = computed(() => {
    const name = this.userName();
    const words = name.split(' ');
    if (words.length >= 2) {
      return (words[0][0] + words[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  });

  // Métodos para manejar el estado de expansión
  toggleGroup(groupId: string): void {
    const expanded = this.expandedGroups();
    const newExpanded = new Set(expanded);

    if (newExpanded.has(groupId)) {
      newExpanded.delete(groupId);
    } else {
      newExpanded.add(groupId);
    }

    this.expandedGroups.set(newExpanded);
  }

  isGroupExpanded(groupId: string): boolean {
    return this.expandedGroups().has(groupId);
  }

  logout(): void {
    this.authService.clear();
    this.router.navigate(['/login']);
  }
}
